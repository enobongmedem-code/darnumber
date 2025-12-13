"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";

export default function WalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        api.getBalance(),
        api.getTransactions(1, 10),
      ]);
      setBalance(balanceRes.data.balance);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = () => {
    // Navigate to checkout page
    router.push("/wallet/checkout");
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 10) {
      setError("Minimum withdrawal amount is $10");
      return;
    }

    if (amount > balance) {
      setError("Insufficient balance");
      return;
    }

    setProcessing(true);

    try {
      await api.requestWithdrawal(amount, "bank_transfer");
      setWithdrawAmount("");
      fetchWalletData();
      alert(
        "Withdrawal request submitted. Processing may take 1-3 business days."
      );
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to process withdrawal");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Wallet</h1>

      {/* Balance Card */}
      <Card className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
        <p className="text-sm opacity-90">Available Balance</p>
        <p className="text-5xl font-bold mt-2">₦{balance.toLocaleString()}</p>
      </Card>

      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Deposit/Withdraw Tabs */}
      <Tabs defaultValue="deposit">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit">Fund Wallet</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Fund Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Add money to your wallet using Paystack, Flutterwave, or Etegram.
              Fast, secure, and convenient Nigerian payment methods.
            </p>
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  ✨ Available Payment Methods
                </h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Card Payments (Mastercard, Visa, Verve)</li>
                  <li>• Bank Transfer</li>
                  <li>• USSD</li>
                  <li>• Mobile Money</li>
                </ul>
              </div>
              <Button onClick={handleDeposit} className="w-full" size="lg">
                Continue to Checkout
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Withdraw Funds</h2>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <Label htmlFor="withdrawAmount">Amount (NGN)</Label>
                <Input
                  id="withdrawAmount"
                  type="number"
                  step="1"
                  min="1000"
                  max={balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Minimum ₦1,000"
                  required
                  disabled={processing}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Minimum withdrawal: ₦1,000. Processing takes 1-3 business
                  days.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={processing || balance < 1000}
              >
                {processing ? "Processing..." : "Request Withdrawal"}
              </Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction History */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No transactions yet
            </p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{tx.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      tx.type === "DEPOSIT" || tx.type === "REFUND"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.type === "DEPOSIT" || tx.type === "REFUND" ? "+" : "-"}₦
                    {Number(tx.amount).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">{tx.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
