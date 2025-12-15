# Toast Notification System

This project uses a customized toast notification system based on `sonner` for consistent and user-friendly notifications across the application.

## Basic Usage

Import the toast utility:

```typescript
import { toast } from "@/lib/toast";
```

### Simple Toasts

```typescript
// Success
toast.success("Operation successful", "Your changes have been saved.");

// Error
toast.error("Something went wrong", "Please try again later.");

// Warning
toast.warning("Warning message", "This action cannot be undone.");

// Info
toast.info("Did you know?", "You can customize your profile settings.");

// Loading
const loadingToast = toast.loading(
  "Processing...",
  "Please wait while we process your request."
);
// Later dismiss it
toast.dismiss(loadingToast);
```

### Promise-based Toasts

For async operations:

```typescript
toast.promise(fetchData(), {
  loading: "Loading data...",
  success: "Data loaded successfully!",
  error: "Failed to load data",
});

// With dynamic messages
toast.promise(createOrder(data), {
  loading: "Creating order...",
  success: (order) => `Order #${order.orderNumber} created successfully!`,
  error: (err) => `Failed to create order: ${err.message}`,
});
```

## Specialized Toast Categories

### Authentication

```typescript
// Login
toast.auth.loginSuccess();
toast.auth.loginError("Invalid credentials");

// Signup
toast.auth.signupSuccess();
toast.auth.signupError("Email already exists");

// Logout
toast.auth.logoutSuccess();

// Session
toast.auth.sessionExpired();

// Password reset
toast.auth.passwordResetSent();
toast.auth.passwordResetSuccess();
```

### Orders

```typescript
// Create order
toast.order.created("ORD-12345");

// Update order
toast.order.updated("ORD-12345");

// Cancel order
toast.order.cancelled("ORD-12345");

// Order failed
toast.order.failed("Insufficient balance");

// SMS received
toast.order.smsReceived("ORD-12345");
```

### Payments

```typescript
// Payment success
toast.payment.success(100, "USD");

// Payment pending
toast.payment.pending();

// Payment failed
toast.payment.failed("Card declined");

// Insufficient balance
toast.payment.insufficientBalance();
```

### Wallet

```typescript
// Top up
toast.wallet.topupSuccess(500, "NGN");

// Withdrawal
toast.wallet.withdrawalSuccess(1000, "NGN");
```

### API Errors

```typescript
// Server error (500)
toast.api.serverError();

// Not found (404)
toast.api.notFound("User");

// Network error
toast.api.networkError();

// Unauthorized (401/403)
toast.api.unauthorized();

// Validation error (422)
toast.api.validationError("Email is required");
```

### Form Operations

```typescript
// Save
toast.form.saveSuccess("Profile");
toast.form.saveError("Failed to update profile");

// Delete
toast.form.deleteSuccess("User account");
toast.form.deleteError("Cannot delete active account");
```

### Copy to Clipboard

```typescript
toast.copy.success("Referral code");
```

## Examples in Context

### Login Page

```typescript
const handleLogin = async (data: LoginData) => {
  try {
    const result = await api.login(data);
    toast.auth.loginSuccess();
    router.push("/dashboard");
  } catch (error: any) {
    if (error.response?.status === 401) {
      toast.auth.loginError("Invalid email or password");
    } else {
      toast.api.serverError();
    }
  }
};
```

### Order Creation

```typescript
const handleCreateOrder = async (orderData: OrderData) => {
  const toastId = toast.loading("Creating order...");

  try {
    const order = await api.createOrder(orderData);
    toast.dismiss(toastId);
    toast.order.created(order.orderNumber);
    router.push(`/orders/${order.id}`);
  } catch (error: any) {
    toast.dismiss(toastId);

    if (error.response?.status === 402) {
      toast.payment.insufficientBalance();
    } else {
      toast.order.failed(error.response?.data?.message);
    }
  }
};
```

### Payment Processing

```typescript
const handlePayment = async (amount: number) => {
  toast.promise(api.processPayment(amount), {
    loading: "Processing payment...",
    success: (result) => {
      toast.payment.success(amount, result.currency);
      return "Payment successful!";
    },
    error: (err) => {
      if (err.response?.status === 402) {
        toast.payment.insufficientBalance();
      }
      return "Payment failed";
    },
  });
};
```

### Form Submission

```typescript
const handleSubmit = async (formData: ProfileData) => {
  try {
    await api.updateProfile(formData);
    toast.form.saveSuccess("Profile");
  } catch (error: any) {
    if (error.response?.status === 422) {
      toast.api.validationError(error.response.data.message);
    } else {
      toast.form.saveError();
    }
  }
};
```

### Copying to Clipboard

```typescript
const handleCopyReferralCode = () => {
  navigator.clipboard.writeText(referralCode);
  toast.copy.success("Referral code");
};
```

## Customization

The toast system uses `sonner` under the hood, which supports theming and positioning. To customize globally, update the `<Toaster />` component in your root layout:

```tsx
<Toaster position="top-right" richColors closeButton expand={false} />
```

For more details, see the [Sonner documentation](https://sonner.emilkowal.ski/).
