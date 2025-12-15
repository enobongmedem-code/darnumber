import { toast as sonnerToast } from "sonner";

/**
 * Customized toast notifications for different scenarios
 */
export const toast = {
  // Success toasts
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, {
      description,
      duration: 4000,
    });
  },

  // Error toasts
  error: (message: string, description?: string) => {
    return sonnerToast.error(message, {
      description,
      duration: 5000,
    });
  },

  // Warning toasts
  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, {
      description,
      duration: 4000,
    });
  },

  // Info toasts
  info: (message: string, description?: string) => {
    return sonnerToast.info(message, {
      description,
      duration: 4000,
    });
  },

  // Loading toasts
  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    });
  },

  // Promise-based toasts (for async operations)
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  // Dismiss a toast
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId);
  },

  // Custom toasts for specific scenarios
  auth: {
    loginSuccess: () => {
      return sonnerToast.success("Welcome back!", {
        description: "You have successfully logged in.",
        duration: 3000,
      });
    },
    loginError: (reason?: string) => {
      return sonnerToast.error("Login failed", {
        description: reason || "Invalid email or password.",
        duration: 5000,
      });
    },
    logoutSuccess: () => {
      return sonnerToast.success("Logged out", {
        description: "You have been logged out successfully.",
        duration: 3000,
      });
    },
    sessionExpired: () => {
      return sonnerToast.error("Session expired", {
        description: "Please log in again to continue.",
        duration: 5000,
      });
    },
    signupSuccess: () => {
      return sonnerToast.success("Account created!", {
        description: "Welcome! Your account has been created successfully.",
        duration: 4000,
      });
    },
    signupError: (reason?: string) => {
      return sonnerToast.error("Signup failed", {
        description: reason || "Unable to create account. Please try again.",
        duration: 5000,
      });
    },
    passwordResetSent: () => {
      return sonnerToast.success("Password reset email sent", {
        description: "Check your email for the reset link.",
        duration: 5000,
      });
    },
    passwordResetSuccess: () => {
      return sonnerToast.success("Password reset successful", {
        description: "You can now log in with your new password.",
        duration: 4000,
      });
    },
  },

  order: {
    created: (orderNumber?: string) => {
      return sonnerToast.success("Order created!", {
        description: orderNumber
          ? `Order #${orderNumber} has been created successfully.`
          : "Your order has been created successfully.",
        duration: 4000,
      });
    },
    updated: (orderNumber?: string) => {
      return sonnerToast.success("Order updated", {
        description: orderNumber
          ? `Order #${orderNumber} has been updated.`
          : "Your order has been updated.",
        duration: 3000,
      });
    },
    cancelled: (orderNumber?: string) => {
      return sonnerToast.info("Order cancelled", {
        description: orderNumber
          ? `Order #${orderNumber} has been cancelled.`
          : "Your order has been cancelled.",
        duration: 4000,
      });
    },
    failed: (reason?: string) => {
      return sonnerToast.error("Order failed", {
        description:
          reason || "Unable to process your order. Please try again.",
        duration: 5000,
      });
    },
    smsReceived: (orderNumber?: string) => {
      return sonnerToast.success("SMS received!", {
        description: orderNumber
          ? `New SMS received for order #${orderNumber}.`
          : "New SMS message received.",
        duration: 5000,
      });
    },
  },

  payment: {
    success: (amount?: number, currency?: string) => {
      const formattedAmount =
        amount && currency ? `${currency} ${amount.toLocaleString()}` : "";
      return sonnerToast.success("Payment successful", {
        description: formattedAmount
          ? `${formattedAmount} has been added to your wallet.`
          : "Your payment has been processed successfully.",
        duration: 4000,
      });
    },
    pending: () => {
      return sonnerToast.info("Payment pending", {
        description:
          "Your payment is being processed. This may take a few minutes.",
        duration: 5000,
      });
    },
    failed: (reason?: string) => {
      return sonnerToast.error("Payment failed", {
        description: reason || "Unable to process payment. Please try again.",
        duration: 5000,
      });
    },
    insufficientBalance: () => {
      return sonnerToast.error("Insufficient balance", {
        description: "Please add funds to your wallet to continue.",
        duration: 5000,
      });
    },
  },

  wallet: {
    topupSuccess: (amount: number, currency: string) => {
      return sonnerToast.success("Wallet topped up!", {
        description: `${currency} ${amount.toLocaleString()} has been added to your wallet.`,
        duration: 4000,
      });
    },
    withdrawalSuccess: (amount: number, currency: string) => {
      return sonnerToast.success("Withdrawal initiated", {
        description: `${currency} ${amount.toLocaleString()} withdrawal is being processed.`,
        duration: 4000,
      });
    },
  },

  api: {
    serverError: () => {
      return sonnerToast.error("Server error", {
        description: "Something went wrong on our end. Please try again later.",
        duration: 5000,
      });
    },
    notFound: (resource?: string) => {
      return sonnerToast.error("Not found", {
        description: resource
          ? `${resource} not found.`
          : "The requested resource could not be found.",
        duration: 4000,
      });
    },
    networkError: () => {
      return sonnerToast.error("Connection error", {
        description:
          "Unable to connect to the server. Please check your internet connection.",
        duration: 5000,
      });
    },
    unauthorized: () => {
      return sonnerToast.error("Unauthorized", {
        description: "You don't have permission to perform this action.",
        duration: 4000,
      });
    },
    validationError: (message?: string) => {
      return sonnerToast.error("Validation error", {
        description: message || "Please check your input and try again.",
        duration: 4000,
      });
    },
  },

  form: {
    saveSuccess: (formName?: string) => {
      return sonnerToast.success("Saved successfully", {
        description: formName
          ? `${formName} has been saved.`
          : "Your changes have been saved.",
        duration: 3000,
      });
    },
    saveError: (reason?: string) => {
      return sonnerToast.error("Save failed", {
        description: reason || "Unable to save changes. Please try again.",
        duration: 4000,
      });
    },
    deleteSuccess: (itemName?: string) => {
      return sonnerToast.success("Deleted successfully", {
        description: itemName
          ? `${itemName} has been deleted.`
          : "Item has been deleted.",
        duration: 3000,
      });
    },
    deleteError: (reason?: string) => {
      return sonnerToast.error("Delete failed", {
        description: reason || "Unable to delete. Please try again.",
        duration: 4000,
      });
    },
  },

  copy: {
    success: (content?: string) => {
      return sonnerToast.success("Copied!", {
        description: content
          ? `${content} copied to clipboard.`
          : "Copied to clipboard.",
        duration: 2000,
      });
    },
  },
};
