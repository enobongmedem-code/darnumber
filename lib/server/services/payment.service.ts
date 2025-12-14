import { prisma } from "@/lib/server/prisma";
import { RedisService } from "@/lib/server/services/redis.service";

const redis = new RedisService();

export class PaymentService {
  async initializePayment(input: { userId: string; amount: number; provider: 'etegram' | 'paystack' | 'flutterwave' }) {
    const { userId, amount, provider } = input
    if (amount <= 0) throw new Error('Invalid amount')

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, userName: true, phone: true, currency: true } })
    if (!user) throw new Error('User not found')

    if (provider === 'etegram') {
      const projectId = process.env.ETEGRAM_PROJECT_ID
      const publicKey = process.env.ETEGRAM_PUBLIC_KEY
      if (!projectId || !publicKey) throw new Error('Etegram credentials not configured')

      const reference = `ETG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const initUrl = `https://api-checkout.etegram.com/api/transaction/initialize/${projectId}`
      const res = await fetch(initUrl, {
        if (provider === 'etegram') {
        headers: { 'Authorization': `Bearer ${publicKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(Number(amount)),
          email: user.email,
          phone: user.phone || undefined,
          firstname: user.userName || undefined,
          lastname: undefined,
          reference,
        }),
      })
      if (!res.ok) throw new Error('Failed to initialize Etegram payment')
      const data = await res.json() as any
      const authUrl = data?.data?.authorization_url
      const accessCode = data?.data?.access_code
      const ref = data?.data?.reference || reference
      if (!authUrl || !accessCode) throw new Error('Invalid Etegram init response')

      await prisma.transaction.create({
        data: {
          userId,
          transactionNumber: `DEP-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          type: 'DEPOSIT',
          amount: Math.round(Number(amount)),
          currency: 'NGN',
          balanceBefore: 0 as any,
          balanceAfter: 0 as any,
          status: 'PENDING',
          description: 'Deposit via Etegram',
          paymentMethod: 'etegram',
          referenceId: ref,
          paymentDetails: { accessCode, authorizationUrl: authUrl },
        },
      })

      return { authorizationUrl: authUrl, reference: ref }
    }

    throw new Error('Payment provider not implemented')
  }

  async verifyPayment(input: { userId: string; reference: string; provider: 'etegram' | 'paystack' | 'flutterwave' }) {
    const { userId, reference, provider } = input
    const txn = await prisma.transaction.findFirst({ where: { userId, type: 'DEPOSIT', referenceId: reference, status: 'PENDING' } })
    if (!txn) throw new Error('Pending transaction not found')

        if (provider === 'paystack') {
          const secret = process.env.PAYSTACK_SECRET_KEY
          if (!secret) throw new Error('Paystack secret not configured')
          const reference = `PST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          const res = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${secret}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Math.round(Number(amount) * 100), email: user.email, currency: 'NGN', reference }),
          })
          if (!res.ok) throw new Error('Failed to initialize Paystack')
          const data = await res.json() as any
          const authUrl = data?.data?.authorization_url
          const ref = data?.data?.reference || reference
          if (!authUrl || !ref) throw new Error('Invalid Paystack init response')

          await prisma.transaction.create({
            data: {
              userId,
              transactionNumber: `DEP-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              type: 'DEPOSIT',
              amount: Math.round(Number(amount)),
              currency: 'NGN',
              balanceBefore: 0 as any,
              balanceAfter: 0 as any,
              status: 'PENDING',
              description: 'Deposit via Paystack',
              paymentMethod: 'paystack',
              referenceId: ref,
              paymentDetails: { authorizationUrl: authUrl },
            },
          })

          return { authorizationUrl: authUrl, reference: ref }
        }

        if (provider === 'flutterwave') {
          const secret = process.env.FLUTTERWAVE_SECRET_KEY
          if (!secret) throw new Error('Flutterwave secret not configured')
          const reference = `FLW-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          const body = { tx_ref: reference, amount: Math.round(Number(amount)), currency: 'NGN', redirect_url: `${process.env.NEXTAUTH_URL || ''}/wallet/verify?ref=${reference}&provider=flutterwave`, customer: { email: user.email, phonenumber: user.phone, name: user.userName }, customizations: { title: 'Wallet Top-up', description: 'Fund wallet' } }
          const res = await fetch('https://api.flutterwave.com/v3/payments', { method: 'POST', headers: { 'Authorization': `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          if (!res.ok) throw new Error('Failed to initialize Flutterwave')
          const data = await res.json() as any
          const link = data?.data?.link
          if (!link) throw new Error('Invalid Flutterwave init response')

          await prisma.transaction.create({
            data: {
              userId,
              transactionNumber: `DEP-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              type: 'DEPOSIT',
              amount: Math.round(Number(amount)),
              currency: 'NGN',
              balanceBefore: 0 as any,
              balanceAfter: 0 as any,
              status: 'PENDING',
              description: 'Deposit via Flutterwave',
              paymentMethod: 'flutterwave',
              referenceId: reference,
              paymentDetails: { link },
            },
          })

          return { authorizationUrl: link, reference }
        }

        throw new Error('Payment provider not implemented')

    if (provider === 'etegram') {
      const projectId = process.env.ETEGRAM_PROJECT_ID
      const publicKey = process.env.ETEGRAM_PUBLIC_KEY
      if (!projectId || !publicKey) throw new Error('Etegram credentials not configured')
      const accessCode = (txn.paymentDetails as any)?.accessCode
          return { success: false, status: 'PENDING', message: 'Awaiting Etegram webhook confirmation' }
      const verifyUrl = `https://api-checkout.etegram.com/api/transaction/verify-payment/${projectId}/${accessCode}`
      const res = await fetch(verifyUrl, { method: 'PATCH', headers: { 'Authorization': `Bearer ${publicKey}` } })
      if (!res.ok) throw new Error('Failed to verify Etegram payment')
      const data = await res.json() as any
      const status = (data?.status || '').toString().toLowerCase()
      const paid = status === 'successful' || status === 'success'
      const amountPaid = Number(data?.amount ?? txn.amount)

      if (!paid) return { success: false, status: data?.status || 'failed' }

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { balance: true, currency: true } })
        if (!user) throw new Error('User not found')
        await tx.user.update({ where: { id: userId }, data: { balance: { increment: amountPaid } } })
        await tx.transaction.update({ where: { id: txn.id }, data: { status: 'COMPLETED', balanceBefore: user.balance, balanceAfter: Number(user.balance) + amountPaid } })
        await tx.activityLog.create({ data: { userId, action: 'DEPOSIT_COMPLETED', resource: 'transaction', resourceId: txn.id, metadata: { provider, reference, amount: amountPaid } } })
      })
      await redis.invalidateUserBalance(userId)
      return { success: true, status: 'success', amount: amountPaid, reference }
    }

    throw new Error('Payment provider not implemented')
  }
  async requestWithdrawal(userId: string, amount: number, bankDetails: any) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    if (Number(user.balance) < amount) throw new Error("Insufficient balance");
    if (amount < 10) throw new Error("Minimum withdrawal amount is $10");

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      });
      await tx.transaction.create({
        data: {
          userId,
          transactionNumber: `WD-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 9)}`,
          type: "WITHDRAWAL",
          amount,
          currency: user.currency,
          balanceBefore: user.balance,
          balanceAfter: Number(user.balance) - amount,
          status: "PENDING",
          description: "Withdrawal to bank account",
          paymentMethod: "bank_transfer",
          paymentDetails: bankDetails,
        },
      });
    });

    await redis.invalidateUserBalance(userId);
    return {
      message:
        "Withdrawal request submitted. Processing time: 1-3 business days",
    };
  }


      private async completeDeposit(userId: string, transactionId: string, amount: number, meta: Record<string, unknown>) {
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.findUnique({ where: { id: userId }, select: { balance: true } })
          if (!user) throw new Error('User not found')
          await tx.user.update({ where: { id: userId }, data: { balance: { increment: amount } } })
          await tx.transaction.update({ where: { id: transactionId }, data: { status: 'COMPLETED', balanceBefore: user.balance, balanceAfter: Number(user.balance) + amount } })
          await tx.activityLog.create({ data: { userId, action: 'DEPOSIT_COMPLETED', resource: 'transaction', resourceId: transactionId, metadata: meta } })
        })
        await redis.invalidateUserBalance(userId)
      }

      async handleEtegramWebhook(payload: any) {
        const reference: string | undefined = payload?.reference || payload?.data?.reference
        const status = (payload?.status || payload?.data?.status || '').toString().toLowerCase()
        const amount = Number(payload?.amount ?? payload?.data?.amount ?? 0)
        if (!reference) return { ok: false }
        const txn = await prisma.transaction.findFirst({ where: { referenceId: reference } })
        if (!txn || txn.status !== 'PENDING') return { ok: true }
        if (!(status === 'successful' || status === 'success')) return { ok: false }
        await this.completeDeposit(txn.userId, txn.id, amount, { provider: 'etegram', reference })
        return { ok: true }
      }

      async handlePaystackWebhook(rawBody: string, signature: string | null) {
        const secret = process.env.PAYSTACK_SECRET_KEY
        if (!secret) return { ok: false, status: 400 }
        const crypto = await import('crypto')
        const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
        if (!signature || signature !== hash) return { ok: false, status: 401 }
        const event = JSON.parse(rawBody)
        if (event?.event === 'charge.success') {
          const ref = event?.data?.reference
          const amount = Number(event?.data?.amount ?? 0) / 100
          if (ref) {
            const txn = await prisma.transaction.findFirst({ where: { referenceId: ref } })
            if (txn && txn.status === 'PENDING') await this.completeDeposit(txn.userId, txn.id, amount, { provider: 'paystack', reference: ref })
          }
        }
        return { ok: true, status: 200 }
      }

      async handleFlutterwaveWebhook(rawBody: string, signature: string | null) {
        const webhookHash = process.env.FLUTTERWAVE_SECRET_HASH
        if (!webhookHash || !signature || signature !== webhookHash) return { ok: false, status: 401 }
        const event = JSON.parse(rawBody)
        const status = (event?.data?.status || '').toString().toLowerCase()
        if (status === 'successful') {
          const ref = event?.data?.tx_ref
          const amount = Number(event?.data?.amount ?? 0)
          if (ref) {
            const txn = await prisma.transaction.findFirst({ where: { referenceId: ref } })
            if (txn && txn.status === 'PENDING') await this.completeDeposit(txn.userId, txn.id, amount, { provider: 'flutterwave', reference: ref })
          }
        }
        return { ok: true, status: 200 }
      }

      async requestPaystackDedicatedAccount(userId: string, preferredBank?: string) {
        const secret = process.env.PAYSTACK_SECRET_KEY
        if (!secret) throw new Error('Paystack secret not configured')
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) throw new Error('User not found')

        const custRes = await fetch('https://api.paystack.co/customer', { method: 'POST', headers: { 'Authorization': `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, first_name: user.userName, phone: user.phone }) })
        if (!custRes.ok) throw new Error('Failed to create Paystack customer')
        const cust = await custRes.json() as any
        const customerCode = cust?.data?.customer_code

        const assignRes = await fetch('https://api.paystack.co/dedicated_account/assign', { method: 'POST', headers: { 'Authorization': `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ customer: customerCode, preferred_bank: preferredBank || 'wema-bank' }) })
        if (!assignRes.ok) throw new Error('Failed to assign dedicated account')
        const assign = await assignRes.json() as any
        const bankName = assign?.data?.bank?.name
        const accountNumber = assign?.data?.account_number
        const accountName = assign?.data?.account_name

        await prisma.user.update({ where: { id: userId }, data: { bankName, accountNumber, bankAccount: accountName } })
        await prisma.activityLog.create({ data: { userId, action: 'DVA_ASSIGNED', resource: 'user', resourceId: userId, metadata: { bankName, accountNumber } } })
        return { bankName, accountNumber, accountName }
      }
  async getPaymentHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, type: { in: ["DEPOSIT", "WITHDRAWAL"] } },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.count({
        where: { userId, type: { in: ["DEPOSIT", "WITHDRAWAL"] } },
      }),
    ]);
    return {
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}
