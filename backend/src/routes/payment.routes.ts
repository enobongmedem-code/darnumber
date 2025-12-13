// ============================================
// PAYMENT ROUTES
// ============================================

import express from "express";
import { authenticate } from "../middleware/auth";
import { validateRequest, validateQuery } from "../middleware/validation";
import { paymentLimiter, apiLimiter } from "../middleware/rateLimit";
import {
  createPaymentIntentSchema,
  withdrawalRequestSchema,
  paginationSchema,
  initializeNigerianPaymentSchema,
} from "../schemas";
import { asyncHandler } from "../middleware/errorHandler";
import { PaymentService } from "../services/payment.service";
import {
  NigerianPaymentService,
  PaymentProvider,
} from "../services/nigerianPayment.service";

const router = express.Router();
const paymentService = new PaymentService();
const nigerianPaymentService = new NigerianPaymentService();

// Create payment intent (deposit)
router.post(
  "/deposit",
  authenticate,
  paymentLimiter,
  validateRequest(createPaymentIntentSchema),
  asyncHandler(async (req, res) => {
    const result = await paymentService.createPaymentIntent({
      userId: req.user.id,
      amount: req.body.amount,
      currency: req.body.currency || "USD",
      metadata: {
        userEmail: req.user.email,
      },
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  })
);

// Request withdrawal
router.post(
  "/withdraw",
  authenticate,
  paymentLimiter,
  validateRequest(withdrawalRequestSchema),
  asyncHandler(async (req, res) => {
    const result = await paymentService.requestWithdrawal(
      req.user.id,
      req.body.amount,
      req.body.bankDetails
    );

    res.json({
      success: true,
      message: result.message,
    });
  })
);

// Get payment history
router.get(
  "/history",
  authenticate,
  apiLimiter,
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await paymentService.getPaymentHistory(
      req.user.id,
      page,
      limit
    );

    res.json({
      success: true,
      ...result,
    });
  })
);

// Get payment methods
router.get(
  "/methods",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await paymentService.getPaymentMethods(req.user.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

// ============================================
// NIGERIAN PAYMENT PROVIDERS
// ============================================

// Get available payment providers
router.get(
  "/providers",
  authenticate,
  asyncHandler(async (req, res) => {
    const providers = nigerianPaymentService.getAvailableProviders();

    res.json({
      success: true,
      data: providers,
    });
  })
);

// Initialize payment with Nigerian providers
router.post(
  "/initialize",
  authenticate,
  paymentLimiter,
  validateRequest(initializeNigerianPaymentSchema),
  asyncHandler(async (req, res) => {
    const { amount, provider } = req.body;

    const result = await nigerianPaymentService.initializePayment({
      userId: req.user.id,
      amount,
      email: req.user.email,
      provider,
      metadata: {
        userEmail: req.user.email,
      },
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  })
);

// Verify payment
router.get(
  "/verify/:reference",
  authenticate,
  asyncHandler(async (req, res) => {
    const { reference } = req.params;
    const { provider } = req.query;

    let result;

    switch (provider) {
      case PaymentProvider.PAYSTACK:
        result = await nigerianPaymentService.verifyPaystackPayment(reference);
        break;
      case PaymentProvider.FLUTTERWAVE:
        result = await nigerianPaymentService.verifyFlutterwavePayment(
          reference
        );
        break;
      case PaymentProvider.ETEGRAM:
        result = await nigerianPaymentService.verifyEtegramPayment(reference);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid payment provider",
        });
    }

    res.json({
      success: true,
      data: result,
    });
  })
);

// ============================================
// WEBHOOKS
// ============================================

// Stripe webhook
router.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  asyncHandler(async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: "Missing stripe signature",
      });
    }

    await paymentService.handleStripeWebhook(req.body.toString(), signature);

    res.json({ received: true });
  })
);

// Paystack webhook
router.post(
  "/webhook/paystack",
  express.json(),
  asyncHandler(async (req, res) => {
    const signature = req.headers["x-paystack-signature"] as string;

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: "Missing paystack signature",
      });
    }

    const verified = await nigerianPaymentService.handlePaystackWebhook(
      req.body,
      signature
    );

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: "Invalid signature",
      });
    }

    res.json({ received: true });
  })
);

// Flutterwave webhook
router.post(
  "/webhook/flutterwave",
  express.json(),
  asyncHandler(async (req, res) => {
    const signature = req.headers["verif-hash"] as string;

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: "Missing flutterwave signature",
      });
    }

    const verified = await nigerianPaymentService.handleFlutterwaveWebhook(
      req.body,
      signature
    );

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: "Invalid signature",
      });
    }

    res.json({ received: true });
  })
);

// Etegram webhook
router.post(
  "/webhook/etegram",
  express.json(),
  asyncHandler(async (req, res) => {
    const verified = await nigerianPaymentService.handleEtegramWebhook(
      req.body
    );

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: "Failed to process webhook",
      });
    }

    res.json({ received: true });
  })
);

export default router;
