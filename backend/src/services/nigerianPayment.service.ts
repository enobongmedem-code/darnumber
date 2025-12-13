// ============================================
// NIGERIAN PAYMENT PROVIDERS SERVICE
// Paystack, Flutterwave, and Etegram Integration
// ============================================

import axios from "axios";
import crypto from "crypto";
import { prisma } from "../config/database";
import { RedisService } from "./redis.service";
import { logger } from "../utils/logger";

const redis = new RedisService();

// Payment Provider Types
export enum PaymentProvider {
  PAYSTACK = "paystack",
  FLUTTERWAVE = "flutterwave",
  ETEGRAM = "etegram",
}

interface InitializePaymentInput {
  userId: string;
  amount: number;
  email: string;
  provider: PaymentProvider;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

interface InitializePaymentResponse {
  success: boolean;
  authorizationUrl: string;
  reference: string;
  transactionId: string;
}

export class NigerianPaymentService {
  // ============================================
  // PAYSTACK INTEGRATION
  // ============================================

  async initializePaystackPayment(
    input: InitializePaymentInput
  ): Promise<InitializePaymentResponse> {
    const { userId, amount, email, callbackUrl, metadata = {} } = input;

    try {
      const reference = `PAY-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { userName: true, balance: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Initialize Paystack payment
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: Math.round(amount * 100), // Convert to kobo (smallest currency unit)
          reference,
          callback_url:
            callbackUrl || `${process.env.FRONTEND_URL}/wallet/verify`,
          metadata: {
            userId,
            userName: user.userName,
            ...metadata,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Create pending transaction
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          transactionNumber: reference,
          type: "DEPOSIT",
          amount,
          currency: "NGN",
          balanceBefore: user.balance,
          balanceAfter: user.balance,
          status: "PENDING",
          description: "Deposit via Paystack",
          referenceId: reference,
          paymentMethod: "paystack",
          paymentDetails: {
            authorizationUrl: response.data.data.authorization_url,
            accessCode: response.data.data.access_code,
          },
        },
      });

      logger.info(
        `Paystack payment initialized for user ${userId}: ${reference}`
      );

      return {
        success: true,
        authorizationUrl: response.data.data.authorization_url,
        reference,
        transactionId: transaction.id,
      };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      logger.error(
        "Paystack initialization error:",
        err.response?.data || err.message
      );
      throw new Error(
        err.response?.data?.message || "Failed to initialize Paystack payment"
      );
    }
  }

  async verifyPaystackPayment(reference: string) {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const paymentData = response.data.data;

      if (paymentData.status === "success") {
        await this.handleSuccessfulPayment({
          reference,
          amount: paymentData.amount / 100, // Convert from kobo
          provider: PaymentProvider.PAYSTACK,
          metadata: paymentData.metadata,
        });
      }

      return {
        success: paymentData.status === "success",
        status: paymentData.status,
        amount: paymentData.amount / 100,
        reference,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }; message?: string };
      logger.error(
        "Paystack verification error:",
        err.response?.data || err.message
      );
      throw new Error("Failed to verify Paystack payment");
    }
  }

  async handlePaystackWebhook(
    payload: Record<string, unknown>,
    signature: string
  ): Promise<boolean> {
    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(JSON.stringify(payload))
      .digest("hex");

    if (hash !== signature) {
      logger.error("Invalid Paystack webhook signature");
      return false;
    }

    const event = payload.event;
    const data = payload.data as {
      reference: string;
      amount: number;
      metadata?: Record<string, unknown>;
    };

    if (event === "charge.success") {
      await this.handleSuccessfulPayment({
        reference: data.reference,
        amount: data.amount / 100,
        provider: PaymentProvider.PAYSTACK,
        metadata: data.metadata,
      });
    }

    return true;
  }

  // ============================================
  // FLUTTERWAVE INTEGRATION
  // ============================================

  async initializeFlutterwavePayment(
    input: InitializePaymentInput
  ): Promise<InitializePaymentResponse> {
    const { userId, amount, email, callbackUrl, metadata = {} } = input;

    try {
      const reference = `FLW-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { userName: true, balance: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Initialize Flutterwave payment
      const response = await axios.post(
        "https://api.flutterwave.com/v3/payments",
        {
          tx_ref: reference,
          amount,
          currency: "NGN",
          redirect_url:
            callbackUrl || `${process.env.FRONTEND_URL}/wallet/verify`,
          customer: {
            email,
            name: user.userName,
          },
          customizations: {
            title: "Wallet Funding",
            description: "Fund your wallet",
            logo: `${process.env.FRONTEND_URL}/logo.png`,
          },
          meta: {
            userId,
            userName: user.userName,
            ...metadata,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Create pending transaction
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          transactionNumber: reference,
          type: "DEPOSIT",
          amount,
          currency: "NGN",
          balanceBefore: user.balance,
          balanceAfter: user.balance,
          status: "PENDING",
          description: "Deposit via Flutterwave",
          referenceId: reference,
          paymentMethod: "flutterwave",
          paymentDetails: {
            paymentLink: response.data.data.link,
          },
        },
      });

      logger.info(
        `Flutterwave payment initialized for user ${userId}: ${reference}`
      );

      return {
        success: true,
        authorizationUrl: response.data.data.link,
        reference,
        transactionId: transaction.id,
      };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      logger.error(
        "Flutterwave initialization error:",
        err.response?.data || err.message
      );
      throw new Error(
        err.response?.data?.message ||
          "Failed to initialize Flutterwave payment"
      );
    }
  }

  async verifyFlutterwavePayment(transactionId: string) {
    try {
      const response = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        }
      );

      const paymentData = response.data.data;

      if (paymentData.status === "successful") {
        await this.handleSuccessfulPayment({
          reference: paymentData.tx_ref,
          amount: paymentData.amount,
          provider: PaymentProvider.FLUTTERWAVE,
          metadata: paymentData.meta,
        });
      }

      return {
        success: paymentData.status === "successful",
        status: paymentData.status,
        amount: paymentData.amount,
        reference: paymentData.tx_ref,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }; message?: string };
      logger.error(
        "Flutterwave verification error:",
        err.response?.data || err.message
      );
      throw new Error("Failed to verify Flutterwave payment");
    }
  }

  async handleFlutterwaveWebhook(
    payload: Record<string, unknown>,
    signature: string
  ): Promise<boolean> {
    // Verify webhook signature
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(payload) + process.env.FLUTTERWAVE_SECRET_HASH!)
      .digest("hex");

    if (hash !== signature) {
      logger.error("Invalid Flutterwave webhook signature");
      return false;
    }

    const event = payload.event;
    const data = payload.data as {
      tx_ref: string;
      amount: number;
      status: string;
      meta?: Record<string, unknown>;
    };

    if (event === "charge.completed" && data.status === "successful") {
      await this.handleSuccessfulPayment({
        reference: data.tx_ref,
        amount: data.amount,
        provider: PaymentProvider.FLUTTERWAVE,
        metadata: data.meta,
      });
    }

    return true;
  }

  // ============================================
  // ETEGRAM INTEGRATION
  // ============================================

  async initializeEtegramPayment(
    input: InitializePaymentInput
  ): Promise<InitializePaymentResponse> {
    const { userId, amount, email, callbackUrl, metadata = {} } = input;

    try {
      const reference = `ETG-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { userName: true, balance: true, phoneNumber: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Parse name from userName (fallback to default if no proper name)
      const nameParts = user.userName.split(" ");
      const firstname = nameParts[0] || "User";
      const lastname = nameParts.slice(1).join(" ") || "Customer";

      const projectID = process.env.ETEGRAM_PROJECT_ID;
      const publicKey = process.env.ETEGRAM_PUBLIC_KEY;

      if (!projectID || !publicKey) {
        throw new Error("Etegram credentials not configured");
      }

      // Initialize Etegram payment
      const response = await axios.post(
        `https://api-checkout.etegram.com/api/transaction/initialize/${projectID}`,
        {
          amount,
          email,
          phone: user.phoneNumber || "08000000000",
          firstname,
          lastname,
          reference,
        },
        {
          headers: {
            Authorization: `Bearer ${publicKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseData = response.data;

      if (!responseData.status) {
        throw new Error(responseData.message || "Failed to initialize payment");
      }

      // Create pending transaction
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          transactionNumber: reference,
          type: "DEPOSIT",
          amount,
          currency: "NGN",
          balanceBefore: user.balance,
          balanceAfter: user.balance,
          status: "PENDING",
          description: "Deposit via Etegram",
          referenceId: reference,
          paymentMethod: "etegram",
          paymentDetails: {
            authorization_url: responseData.data.authorization_url,
            access_code: responseData.data.access_code,
            reference: responseData.data.reference,
          },
        },
      });

      logger.info(
        `Etegram payment initialized for user ${userId}: ${reference}`
      );

      return {
        success: true,
        authorizationUrl: responseData.data.authorization_url,
        reference: responseData.data.reference,
        transactionId: transaction.id,
      };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      logger.error(
        "Etegram initialization error:",
        err.response?.data || err.message
      );
      throw new Error(
        err.response?.data?.message || "Failed to initialize Etegram payment"
      );
    }
  }

  async verifyEtegramPayment(reference: string) {
    try {
      // Find the transaction to get the access code
      const transaction = await prisma.transaction.findFirst({
        where: {
          referenceId: reference,
          paymentMethod: "etegram",
        },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      const paymentDetails = transaction.paymentDetails as Record<
        string,
        unknown
      >;
      const accessCode = paymentDetails?.access_code as string;

      if (!accessCode) {
        throw new Error("Access code not found in transaction");
      }

      const projectID = process.env.ETEGRAM_PROJECT_ID;

      if (!projectID) {
        throw new Error("Etegram project ID not configured");
      }

      const response = await axios.patch(
        `https://api-checkout.etegram.com/api/transaction/verify-payment/${projectID}/${accessCode}`
      );

      const paymentData = response.data;

      if (paymentData.status === "successful") {
        await this.handleSuccessfulPayment({
          reference: paymentData.reference,
          amount: paymentData.amount,
          provider: PaymentProvider.ETEGRAM,
          metadata: paymentData,
        });
      }

      return {
        success: paymentData.status === "successful",
        status: paymentData.status,
        amount: paymentData.amount,
        reference,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }; message?: string };
      logger.error(
        "Etegram verification error:",
        err.response?.data || err.message
      );
      throw new Error("Failed to verify Etegram payment");
    }
  }

  async handleEtegramWebhook(
    payload: Record<string, unknown>
  ): Promise<boolean> {
    try {
      // Etegram webhook payload structure based on documentation
      const status = payload.status as string;
      const reference = payload.reference as string;
      const amount = payload.amount as number;

      if (!reference) {
        logger.error("Etegram webhook: Missing reference");
        return false;
      }

      // Only process successful payments
      if (status === "successful") {
        await this.handleSuccessfulPayment({
          reference,
          amount,
          provider: PaymentProvider.ETEGRAM,
          metadata: payload,
        });

        logger.info(`Etegram webhook processed successfully: ${reference}`);
      } else {
        logger.info(
          `Etegram webhook received non-successful status: ${status}`
        );
      }

      return true;
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error("Etegram webhook error:", err.message);
      return false;
    }
  }

  // ============================================
  // SHARED PAYMENT HANDLER
  // ============================================

  private async handleSuccessfulPayment(params: {
    reference: string;
    amount: number;
    provider: PaymentProvider;
    metadata?: Record<string, unknown>;
  }) {
    const { reference, amount, provider } = params;

    // Find pending transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        referenceId: reference,
        status: "PENDING",
      },
    });

    if (!transaction) {
      logger.error(`Transaction not found for reference: ${reference}`);
      return;
    }

    const userId = transaction.userId;

    // Update user balance and transaction in a single transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true, currency: true },
      });

      if (!user) return;

      const newBalance = Number(user.balance) + amount;

      // Update balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      });

      // Update transaction
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "COMPLETED",
          balanceAfter: newBalance,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId,
          action: "PAYMENT_COMPLETED",
          resource: "transaction",
          resourceId: transaction.id,
          metadata: {
            amount,
            provider,
            reference,
          },
        },
      });
    });

    // Invalidate balance cache
    await redis.invalidateUserBalance(userId);

    // Send notification
    const { notificationQueue } = await import("./queue.service");
    await notificationQueue.add({
      type: "PAYMENT_RECEIVED",
      userId,
      amount,
      currency: transaction.currency,
      transactionNumber: transaction.transactionNumber,
      newBalance: Number(transaction.balanceAfter),
    });

    logger.info(
      `✅ Payment completed for user ${userId}: ₦${amount} via ${provider}`
    );
  }

  // ============================================
  // UNIFIED INITIALIZATION
  // ============================================

  async initializePayment(
    input: InitializePaymentInput
  ): Promise<InitializePaymentResponse> {
    switch (input.provider) {
      case PaymentProvider.PAYSTACK:
        return this.initializePaystackPayment(input);
      case PaymentProvider.FLUTTERWAVE:
        return this.initializeFlutterwavePayment(input);
      case PaymentProvider.ETEGRAM:
        return this.initializeEtegramPayment(input);
      default:
        throw new Error("Invalid payment provider");
    }
  }

  // ============================================
  // GET AVAILABLE PROVIDERS
  // ============================================

  getAvailableProviders() {
    const providers = [];

    if (process.env.PAYSTACK_SECRET_KEY) {
      providers.push({
        name: "Paystack",
        value: PaymentProvider.PAYSTACK,
        description: "Pay with Paystack - Cards, Bank Transfer, USSD",
        logo: "/providers/paystack.png",
      });
    }

    if (process.env.FLUTTERWAVE_SECRET_KEY) {
      providers.push({
        name: "Flutterwave",
        value: PaymentProvider.FLUTTERWAVE,
        description: "Pay with Flutterwave - Cards, Bank, Mobile Money",
        logo: "/providers/flutterwave.png",
      });
    }

    if (process.env.ETEGRAM_PROJECT_ID && process.env.ETEGRAM_PUBLIC_KEY) {
      providers.push({
        name: "Etegram",
        value: PaymentProvider.ETEGRAM,
        description: "Pay with Etegram - Fast & Secure Bank Transfer",
        logo: "/providers/etegram.png",
      });
    }

    return providers;
  }
}
