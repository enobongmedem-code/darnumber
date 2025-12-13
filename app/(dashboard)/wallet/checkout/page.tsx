"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface PaymentProvider {
  name: string;
  value: string;
  description: string;
  logo: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await api.getPaymentProviders();
      setProviders(response.data);
      if (response.data.length > 0) {
        setSelectedProvider(response.data[0].value);
      }
    } catch (error) {
      console.error("Failed to fetch payment providers:", error);
      setError("Failed to load payment providers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount < 100) {
      setError("Minimum deposit amount is ₦100");
      return;
    }

    if (!selectedProvider) {
      setError("Please select a payment provider");
      return;
    }

    setProcessing(true);

    try {
      const response = await api.initializePayment(
        depositAmount,
        selectedProvider
      );

      if (response.success && response.data.authorizationUrl) {
        // Redirect to payment provider's page
        window.location.href = response.data.authorizationUrl;
      } else {
        setError("Failed to initialize payment");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Failed to process payment");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Back
        </Button>
        <h1 className="text-3xl font-bold">Fund Your Wallet</h1>
        <p className="text-muted-foreground mt-2">
          Choose your preferred payment method and enter the amount to fund
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (NGN)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ₦
              </span>
              <Input
                id="amount"
                type="number"
                min="100"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="pl-8"
                required
              />
            </div>
            <p className="text-sm text-muted-foreground">Minimum: ₦100</p>
          </div>

          {/* Payment Provider Selection */}
          <div className="space-y-4">
            <Label>Select Payment Method</Label>
            {providers.length === 0 ? (
              <Alert>
                No payment providers are currently available. Please contact
                support.
              </Alert>
            ) : (
              <div className="space-y-3">
                {providers.map((provider) => (
                  <div
                    key={provider.value}
                    className={`relative flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                      selectedProvider === provider.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedProvider(provider.value)}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={provider.value}
                      checked={selectedProvider === provider.value}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{provider.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {provider.description}
                          </p>
                        </div>
                        {selectedProvider === provider.value && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label>Quick Amount</Label>
            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 2000, 5000].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="w-full"
                >
                  ₦{quickAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={processing || providers.length === 0 || !amount}
          >
            {processing ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              `Proceed to Payment`
            )}
          </Button>
        </form>
      </Card>

      {/* Security Notice */}
      <div className="mt-6 rounded-lg bg-muted p-4">
        <h3 className="font-semibold mb-2">🔒 Secure Payment</h3>
        <p className="text-sm text-muted-foreground">
          Your payment is processed securely through our trusted payment
          partners. We do not store your card details. All transactions are
          encrypted and secure.
        </p>
      </div>
    </div>
  );
}
