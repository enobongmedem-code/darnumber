"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  AlertCircle,
  CheckCircle2,
  Wallet,
  ChevronRight,
} from "lucide-react";

interface Provider {
  id: string;
  name: string;
  displayName: string;
  cover: string;
}

interface Service {
  code: string;
  name: string;
  country: string;
  price: number;
  providers: Provider[];
}

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(0);
  const [serviceSearch, setServiceSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, balanceRes] = await Promise.all([
        api.getAvailableServices(),
        api.getBalance(),
      ]);

      // Enhanced logging to aid debugging of provider/service population
      console.group("[NewOrderPage] fetchData");
      console.log("raw servicesRes:", servicesRes);
      console.log("raw balanceRes:", balanceRes);

      const services: Service[] = servicesRes?.data?.services || [];
      const providersFromApi: Provider[] = servicesRes?.data?.providers || [];

      console.log("services count:", services.length);
      console.log(
        "providersFromApi count:",
        providersFromApi ? providersFromApi.length : 0
      );

      // Fallback: derive providers from services when API doesn't return providers array
      const derivedProvidersMap = new Map<string, Provider>();
      services.forEach((s) => {
        s.providers?.forEach((p) => {
          if (p?.id && !derivedProvidersMap.has(p.id)) {
            derivedProvidersMap.set(p.id, {
              id: p.id,
              name: p.name,
              displayName: p.displayName || p.name,
              cover: "",
            });
          }
        });
      });

      const derivedProviders = Array.from(derivedProvidersMap.values());
      console.log("derivedProviders count:", derivedProviders.length);

      setAllServices(services);

      // Hardcoded providers (Lion & Panda) with canonical names
      const HARDCODED_PROVIDERS: Provider[] = [
        {
          id: "lion",
          name: "sms-man",
          displayName: "Lion",
          cover: "All Countries",
        },
        {
          id: "panda",
          name: "textverified",
          displayName: "Panda",
          cover: "United States",
        },
      ];

      // Try to find corresponding providers from API/derived by name
      const resolveProvider = (canonical: Provider) => {
        const match = (list: Provider[]) =>
          list.find((p) =>
            p.name?.toLowerCase().includes(canonical.name.toLowerCase())
          );
        return (
          match(providersFromApi || []) || match(derivedProviders) || canonical
        );
      };

      const resolvedProviders = HARDCODED_PROVIDERS.map(resolveProvider);
      // Ensure uniqueness by displayName (or id) to avoid duplicates
      const uniqueByKey = new Map<string, Provider>();
      resolvedProviders.forEach((p) => {
        const key = (p.displayName || p.name || p.id).toLowerCase();
        if (!uniqueByKey.has(key)) uniqueByKey.set(key, p);
      });

      setProviders(Array.from(uniqueByKey.values()));
      setBalance(balanceRes.data.balance);
      console.log("balance:", balanceRes.data.balance);

      // Set default provider if available
      const initialProviders = Array.from(uniqueByKey.values());
      if (initialProviders.length > 0) {
        setSelectedProvider(initialProviders[0].id || "lion");
        console.log(
          "selected default provider:",
          initialProviders[0].id,
          initialProviders[0]
        );
      } else {
        console.warn("No providers available from API or derived sources.");
      }
      console.groupEnd();
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  // Get unique service codes for the selected provider
  const availableServices = useMemo(() => {
    if (!selectedProvider) return [];

    const serviceMap = new Map<string, Service>();

    allServices.forEach((service) => {
      if (service.providers.some((p) => p.id === selectedProvider)) {
        if (!serviceMap.has(service.code)) {
          serviceMap.set(service.code, service);
        }
      }
    });

    return Array.from(serviceMap.values());
  }, [allServices, selectedProvider]);

  // Get available countries for selected service and provider
  const availableCountries = useMemo(() => {
    if (!selectedService || !selectedProvider) return [];

    const countries = allServices
      .filter(
        (s) =>
          s.code === selectedService &&
          s.providers.some((p) => p.id === selectedProvider)
      )
      .map((s) => ({
        code: s.country,
        name: s.country, // Will be enhanced with full name from API
        price: s.price,
      }));

    return countries;
  }, [allServices, selectedService, selectedProvider]);

  // Filter services based on search
  const filteredServices = useMemo(() => {
    if (!serviceSearch) return availableServices;
    return availableServices.filter(
      (service) =>
        service.name?.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        service.code?.toLowerCase().includes(serviceSearch.toLowerCase())
    );
  }, [availableServices, serviceSearch]);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return availableCountries;
    return availableCountries.filter(
      (country) =>
        country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        country.code.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [availableCountries, countrySearch]);

  // Reset selections when provider changes
  useEffect(() => {
    setSelectedService("");
    setSelectedCountry("");
  }, [selectedProvider]);

  // Reset country when service changes
  useEffect(() => {
    setSelectedCountry("");
  }, [selectedService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedService || !selectedCountry || !selectedProvider) {
      setError("Please select service, country, and provider");
      return;
    }

    const service = allServices.find(
      (s) =>
        s.code === selectedService &&
        s.country === selectedCountry &&
        s.providers.some((p) => p.id === selectedProvider)
    );

    if (!service) {
      setError("Service not found");
      return;
    }

    if (balance < service.price) {
      setError(
        `Insufficient balance. You need ₦${service.price.toLocaleString()} but only have ₦${balance.toLocaleString()}. Please add ₦${(
          service.price - balance
        ).toLocaleString()} to your wallet.`
      );
      return;
    }

    setCreating(true);

    try {
      const provider = providers.find((p) => p.id === selectedProvider);
      const response = await api.createOrder({
        serviceCode: selectedService,
        country: selectedCountry,
        provider: provider?.name,
      });

      if (response.ok) {
        router.push(`/orders/${response.data.orderId}`);
      } else {
        setError(response.error || "Failed to create order");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to create order. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const currentService = allServices.find(
    (s) => s.code === selectedService && s.country === selectedCountry
  );
  const currentProvider = providers.find((p) => p.id === selectedProvider);
  const insufficientBalance = currentService && balance < currentService.price;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        ← Back
      </Button>

      {/* Hybrid Layout: Mobile stacks vertically, Desktop uses sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Main Content (Mobile: full width, Desktop: 2/3) */}
        <div className="flex-1 lg:w-2/3 space-y-6">
          {/* Balance & Provider Info - TOP on Mobile, Hidden on Desktop */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Balance Card */}
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-muted-foreground">
                  Available Balance
                </p>
              </div>
              <p className="text-2xl md:text-3xl font-bold">
                ₦{balance.toLocaleString()}
              </p>
              <Button
                variant="link"
                className="p-0 h-auto mt-2 text-sm"
                onClick={() => router.push("/wallet")}
              >
                Add funds →
              </Button>
            </Card>

            {/* Current Provider Card */}
            {currentProvider && (
              <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-xl font-bold">
                    {currentProvider.displayName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">
                      {currentProvider.displayName}
                    </h3>
                    <Badge variant="secondary" className="text-xs mt-1">
                      Active Provider
                    </Badge>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Main Order Form */}
          <Card className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Buy Number</h1>

            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div className="ml-2 text-sm text-red-800 dark:text-red-200">
                  {error}
                </div>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Provider Selection */}
              <div>
                <Label className="mb-3 block text-base font-semibold">
                  Select Provider
                </Label>

                {/* Mobile: Dialog Trigger */}
                <div className="lg:hidden">
                  <Dialog
                    open={providerDialogOpen}
                    onOpenChange={setProviderDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-14 justify-between text-left font-normal"
                        disabled={creating}
                      >
                        {currentProvider ? (
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl font-bold ${
                                currentProvider.name
                                  .toLowerCase()
                                  .includes("lion") ||
                                currentProvider.name
                                  .toLowerCase()
                                  .includes("sms-man")
                                  ? "bg-amber-100 dark:bg-amber-900"
                                  : currentProvider.name
                                      .toLowerCase()
                                      .includes("panda") ||
                                    currentProvider.name
                                      .toLowerCase()
                                      .includes("textverified")
                                  ? "bg-green-100 dark:bg-green-900"
                                  : "bg-primary/10"
                              }`}
                            >
                              {currentProvider.name
                                .toLowerCase()
                                .includes("lion") ||
                              currentProvider.name
                                .toLowerCase()
                                .includes("sms-man")
                                ? "🦁"
                                : currentProvider.name
                                    .toLowerCase()
                                    .includes("panda") ||
                                  currentProvider.name
                                    .toLowerCase()
                                    .includes("textverified")
                                ? "🐼"
                                : currentProvider.displayName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold">
                                {currentProvider.displayName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {currentProvider.cover}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Select a provider
                          </span>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Select Provider</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 py-4">
                        {providers.length === 0 && (
                          <div className="p-4 text-center text-sm text-muted-foreground border rounded-md">
                            No providers available right now. Pull to refresh or
                            try again later.
                          </div>
                        )}
                        {providers.map((provider) => {
                          // Map provider icons based on name
                          const getProviderIcon = (name: string) => {
                            if (
                              name.toLowerCase().includes("lion") ||
                              name.toLowerCase().includes("sms-man")
                            ) {
                              return "🦁";
                            }
                            if (
                              name.toLowerCase().includes("panda") ||
                              name.toLowerCase().includes("textverified")
                            ) {
                              return "🐼";
                            }
                            return provider.displayName.charAt(0);
                          };

                          const getProviderBg = (name: string) => {
                            if (
                              name.toLowerCase().includes("lion") ||
                              name.toLowerCase().includes("sms-man")
                            ) {
                              return selectedProvider === provider.id
                                ? "bg-amber-500 text-white"
                                : "bg-amber-100 dark:bg-amber-900";
                            }
                            if (
                              name.toLowerCase().includes("panda") ||
                              name.toLowerCase().includes("textverified")
                            ) {
                              return selectedProvider === provider.id
                                ? "bg-green-500 text-white"
                                : "bg-green-100 dark:bg-green-900";
                            }
                            return selectedProvider === provider.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/10 text-primary";
                          };

                          return (
                            <button
                              key={provider.id}
                              type="button"
                              onClick={() => {
                                setSelectedProvider(provider.id);
                                setProviderDialogOpen(false);
                              }}
                              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                selectedProvider === provider.id
                                  ? "border-primary bg-primary/5 shadow-md"
                                  : "border-gray-200 hover:border-primary/50 dark:border-gray-700"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1">
                                  <div
                                    className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold flex-shrink-0 ${getProviderBg(
                                      provider.cover
                                    )}`}
                                  >
                                    {getProviderIcon(provider.name)}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-base">
                                      {provider.displayName}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                      {provider.cover}
                                    </p>
                                  </div>
                                </div>
                                {selectedProvider === provider.id && (
                                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Desktop: Card Grid */}
                <div className="hidden lg:grid lg:grid-cols-2 gap-4">
                  {providers.length === 0 ? (
                    <div className="col-span-2 p-4 text-center text-sm text-muted-foreground border rounded-md">
                      No providers available. Please try again later.
                    </div>
                  ) : (
                    providers.map((provider) => {
                      // Map provider icons based on name
                      const getProviderIcon = (name: string) => {
                        if (
                          name.toLowerCase().includes("lion") ||
                          name.toLowerCase().includes("sms-man")
                        ) {
                          return "🦁";
                        }
                        if (
                          name.toLowerCase().includes("panda") ||
                          name.toLowerCase().includes("textverified")
                        ) {
                          return "🐼";
                        }
                        return provider.displayName.charAt(0);
                      };

                      const getProviderBg = (name: string) => {
                        if (
                          name.toLowerCase().includes("lion") ||
                          name.toLowerCase().includes("sms-man")
                        ) {
                          return selectedProvider === provider.id
                            ? "bg-amber-500"
                            : "bg-amber-100 dark:bg-amber-900";
                        }
                        if (
                          name.toLowerCase().includes("panda") ||
                          name.toLowerCase().includes("textverified")
                        ) {
                          return selectedProvider === provider.id
                            ? "bg-green-500"
                            : "bg-green-100 dark:bg-green-900";
                        }
                        return selectedProvider === provider.id
                          ? "bg-primary"
                          : "bg-primary/10";
                      };

                      return (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedProvider(provider.id);
                          }}
                          disabled={creating}
                          className={`p-5 rounded-xl border-2 transition-all text-left hover:shadow-lg active:scale-[0.98] ${
                            selectedProvider === provider.id
                              ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/30"
                              : "border-gray-200 hover:border-primary/50 hover:bg-accent dark:border-gray-700 dark:hover:border-primary/50"
                          } ${
                            creating
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          style={{
                            userSelect: "none",
                            WebkitUserSelect: "none",
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold flex-shrink-0 transition-all ${getProviderBg(
                                provider.cover
                              )} ${
                                selectedProvider === provider.id
                                  ? "text-white"
                                  : ""
                              }`}
                            >
                              {getProviderIcon(provider.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg mb-1">
                                    {provider.displayName}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {provider.cover}
                                  </p>
                                </div>
                                {selectedProvider === provider.id && (
                                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 animate-in zoom-in duration-200" />
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <Label
                  htmlFor="service"
                  className="mb-2 block text-base font-semibold"
                >
                  Service
                  {availableServices.length > 0 && (
                    <Badge
                      variant="outline"
                      className="ml-2 text-xs font-normal"
                    >
                      {availableServices.length} available
                    </Badge>
                  )}
                </Label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="pl-9 h-11"
                    disabled={creating || !selectedProvider}
                  />
                </div>
                <Select
                  value={selectedService}
                  onValueChange={setSelectedService}
                  disabled={creating || !selectedProvider}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {filteredServices.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {selectedProvider
                          ? "No services found"
                          : "Please select a provider first"}
                      </div>
                    ) : (
                      filteredServices.map((service) => (
                        <SelectItem key={service.code} value={service.code}>
                          <div className="flex items-center gap-2 py-1">
                            <span className="font-medium">{service.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Country Selection */}
              <div>
                <Label
                  htmlFor="country"
                  className="mb-2 block text-base font-semibold"
                >
                  Country
                  {availableCountries.length > 0 && (
                    <Badge
                      variant="outline"
                      className="ml-2 text-xs font-normal"
                    >
                      {availableCountries.length} available
                    </Badge>
                  )}
                </Label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search countries..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="pl-9 h-11"
                    disabled={creating || !selectedService}
                  />
                </div>
                <Select
                  value={selectedCountry}
                  onValueChange={setSelectedCountry}
                  disabled={creating || !selectedService}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {filteredCountries.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {selectedService
                          ? "No countries available"
                          : "Please select a service first"}
                      </div>
                    ) : (
                      filteredCountries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center justify-between gap-2 py-1 w-full">
                            <span className="font-medium">{country.name}</span>
                            <span className="font-bold text-primary">
                              ₦{country.price.toLocaleString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button - Mobile */}
              <Button
                type="submit"
                className="w-full h-12 text-base lg:hidden"
                disabled={
                  creating ||
                  insufficientBalance ||
                  !selectedService ||
                  !selectedCountry ||
                  !selectedProvider
                }
              >
                {creating ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : insufficientBalance ? (
                  "Insufficient Balance"
                ) : (
                  "Buy Number"
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:w-1/3">
          <div className="sticky top-6 space-y-4">
            {/* Balance Card */}
            <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-muted-foreground">
                  Available Balance
                </p>
              </div>
              <p className="text-3xl font-bold mb-3">
                ₦{balance.toLocaleString()}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push("/wallet")}
              >
                Add Funds
              </Button>
            </Card>

            {/* Current Provider Card */}
            {currentProvider && (
              <Card className="p-5 shadow-lg border-2 border-primary/20">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {currentProvider.displayName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">
                      {currentProvider.displayName}
                    </h3>
                    <Badge variant="default" className="text-xs mt-1">
                      Active Provider
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  This provider will be used to purchase your virtual number.
                </p>
              </Card>
            )}

            {/* Order Summary */}
            {currentService ? (
              <Card className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 shadow-lg">
                <h3 className="font-bold mb-4 text-lg flex items-center gap-2">
                  <span>Order Summary</span>
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-semibold">{currentService.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Country:</span>
                    <span className="font-semibold">
                      {currentService.country}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="font-semibold">
                      {currentProvider?.displayName}
                    </span>
                  </div>
                  <div className="pt-3 border-t-2 border-gray-300 dark:border-gray-600 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-base">Total:</span>
                      <span
                        className={`font-bold text-2xl ${
                          insufficientBalance ? "text-red-600" : "text-primary"
                        }`}
                      >
                        ₦{currentService.price.toLocaleString()}
                      </span>
                    </div>
                    {insufficientBalance && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                          ⚠️ Insufficient balance
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Need ₦
                          {(currentService.price - balance).toLocaleString()}{" "}
                          more
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button - Desktop */}
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  className="w-full h-12 text-base mt-5 shadow-lg"
                  disabled={
                    creating ||
                    insufficientBalance ||
                    !selectedService ||
                    !selectedCountry ||
                    !selectedProvider
                  }
                >
                  {creating ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Processing...
                    </>
                  ) : insufficientBalance ? (
                    "Insufficient Balance"
                  ) : (
                    "Buy Number Now"
                  )}
                </Button>
              </Card>
            ) : (
              <Card className="p-5 bg-gray-50 dark:bg-gray-900 border-dashed">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a service and country to see the order summary
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
