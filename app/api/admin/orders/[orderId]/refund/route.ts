import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, error } from "@/lib/server/utils/response";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

// Issue a refund for an order
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireAuth();
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return error("Forbidden", 403);
    }

    const { orderId } = await params;
    const body = await req.json();
    const reason = body.reason || "Admin refund";

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return error("Order not found", 404);
    }

    if (order.status === "REFUNDED") {
      return error("Order already refunded", 400);
    }

    const refundAmount = Number(order.finalPrice);

    // Perform refund in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get current user balance
      const user = await tx.user.findUnique({
        where: { id: order.userId },
        select: { balance: true, currency: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const newBalance = Number(user.balance) + refundAmount;

      // Update user balance
      await tx.user.update({
        where: { id: order.userId },
        data: { balance: newBalance },
      });

      // Create refund transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: order.userId,
          transactionNumber: `REF-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase()}`,
          type: "REFUND",
          amount: refundAmount,
          currency: user.currency,
          balanceBefore: user.balance,
          balanceAfter: newBalance,
          status: "COMPLETED",
          orderId: order.id,
          description: `Refund for order ${order.orderNumber}: ${reason}`,
          adminNotes: `Refunded by admin: ${session.user.id}`,
        },
      });

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "REFUNDED" },
      });

      // Log the action
      await tx.activityLog.create({
        data: {
          userId: order.userId,
          action: "ORDER_REFUNDED",
          resource: "order",
          resourceId: orderId,
          metadata: {
            adminId: session.user.id,
            refundAmount,
            reason,
            previousStatus: order.status,
            transactionId: transaction.id,
          },
        },
      });

      return { order: updatedOrder, transaction };
    });

    return json({ ok: true, data: result });
  } catch (e) {
    console.error("Admin refund order error:", e);
    if (e instanceof Error && e.message === "Unauthorized") {
      return error("Unauthorized", 401);
    }
    return error("Unexpected error", 500);
  }
}
