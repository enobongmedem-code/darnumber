"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";

export default function VerifyPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<{
    amount?: number;
    reference?: string;
  } | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get reference and provider from URL params
        const reference =
          searchParams.get("reference") ||
          searchParams.get("tx_ref") ||
          searchParams.get("transaction_id");
        const provider =
          searchParams.get("provider") ||
          (searchParams.get("reference")
            ? "paystack"
            : searchParams.get("tx_ref")
            ? "flutterwave"
            : "etegram");

        if (!reference) {
          setError("Invalid payment reference");
          setVerifying(false);
          return;
        }

        const response = await api.verifyPayment(reference, provider);

        if (response.success && response.data.success) {
          setSuccess(true);
          setPaymentDetails(response.data);
        } else {
          setError("Payment verification failed");
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } } };
        setError(error.response?.data?.error || "Failed to verify payment");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (verifying) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
          <p className="text-muted-foreground">
            Please wait while we confirm your payment...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center p-6">
      <Card className="p-8 max-w-md w-full">
        {success ? (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Your wallet has been funded successfully.
            </p>
            {paymentDetails && (
              <div className="bg-muted rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold">
                    ₦{paymentDetails.amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono text-sm">
                    {paymentDetails.reference}
                  </span>
                </div>
              </div>
            )}
            <Button className="w-full" onClick={() => router.push("/wallet")}>
              Go to Wallet
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
            <Alert variant="destructive" className="mb-6 text-left">
              {error || "We couldn't verify your payment. Please try again."}
            </Alert>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => router.push("/wallet/checkout")}
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/wallet")}
              >
                Back to Wallet
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
