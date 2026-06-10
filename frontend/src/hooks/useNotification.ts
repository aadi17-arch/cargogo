import toast, { ToastOptions } from 'react-hot-toast';

export const useNotification = () => {
  const success = (message: string, options?: ToastOptions) => {
    if (!options?.id) {
      toast.dismiss();
    }
    return toast.success(message, {
      duration: 4000,
      ...options,
    });
  };

  const error = (message: string, options?: ToastOptions) => {
    if (!options?.id) {
      toast.dismiss();
    }
    return toast.error(message, {
      duration: 5000,
      ...options,
    });
  };

  const warning = (message: string, options?: ToastOptions) => {
    if (!options?.id) {
      toast.dismiss();
    }
    return toast(message, {
      duration: 5000,
      ...options,
    });
  };

  const info = (message: string, options?: ToastOptions) => {
    if (!options?.id) {
      toast.dismiss();
    }
    return toast(message, {
      duration: 4000,
      ...options,
    });
  };

  const loading = (message: string, options?: ToastOptions) => {
    if (!options?.id) {
      toast.dismiss();
    }
    return toast.loading(message, options);
  };

  const dismiss = (id?: string) => {
    toast.dismiss(id);
  };

  const promise = <T>(
    promiseObj: Promise<T>,
    msgs: { loading: string; success: string; error: string },
    options?: ToastOptions
  ) => {
    if (!options?.id) {
      toast.dismiss();
    }
    return toast.promise(promiseObj, msgs, options);
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    promise,
  };
};
