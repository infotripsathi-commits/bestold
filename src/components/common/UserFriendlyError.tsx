import { AlertCircle, RefreshCw, Home, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface ErrorInfo {
  title: string;
  message: string;
  suggestion?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  canRetry?: boolean;
  canGoBack?: boolean;
  canGoHome?: boolean;
  showSupport?: boolean;
}

interface UserFriendlyErrorProps {
  error: Error;
  onRetry?: () => void;
  onReset?: () => void;
}

// Map technical errors to user-friendly messages
function getErrorInfo(error: Error): ErrorInfo {
  const errorMessage = error.message.toLowerCase();
  
  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      title: 'Connection Problem',
      message: 'We\'re having trouble connecting to our servers.',
      suggestion: 'Please check your internet connection and try again.',
      canRetry: true,
      canGoBack: true,
    };
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout')) {
    return {
      title: 'Request Timed Out',
      message: 'The request took too long to complete.',
      suggestion: 'This might be due to slow internet or high server load. Please try again.',
      canRetry: true,
    };
  }
  
  // Authentication errors
  if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
    return {
      title: 'Authentication Required',
      message: 'You need to be logged in to access this feature.',
      suggestion: 'Please log in to your account and try again.',
      action: {
        label: 'Go to Login',
        onClick: () => (window.location.href = '/login'),
      },
    };
  }
  
  // Permission errors
  if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
    return {
      title: 'Access Denied',
      message: 'You don\'t have permission to access this resource.',
      suggestion: 'If you believe this is an error, please contact support.',
      canGoHome: true,
      showSupport: true,
    };
  }
  
  // Not found errors
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return {
      title: 'Page Not Found',
      message: 'The page you\'re looking for doesn\'t exist.',
      suggestion: 'It might have been moved or deleted.',
      canGoHome: true,
      canGoBack: true,
    };
  }
  
  // Data validation errors
  if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
    return {
      title: 'Invalid Data',
      message: 'Some of the information you provided is invalid.',
      suggestion: 'Please check your input and try again.',
      canRetry: true,
      canGoBack: true,
    };
  }
  
  // Server errors
  if (errorMessage.includes('500') || errorMessage.includes('server error')) {
    return {
      title: 'Server Error',
      message: 'Something went wrong on our end.',
      suggestion: 'Our team has been notified. Please try again in a few moments.',
      canRetry: true,
      canGoHome: true,
      showSupport: true,
    };
  }
  
  // Database errors
  if (errorMessage.includes('database') || errorMessage.includes('query')) {
    return {
      title: 'Data Error',
      message: 'We encountered a problem accessing your data.',
      suggestion: 'Please try again. If the problem persists, contact support.',
      canRetry: true,
      showSupport: true,
    };
  }
  
  // Default error
  return {
    title: 'Something Went Wrong',
    message: 'We encountered an unexpected error.',
    suggestion: 'Please try again. If the problem continues, contact our support team.',
    canRetry: true,
    canGoHome: true,
    showSupport: true,
  };
}

export default function UserFriendlyError({ error, onRetry, onReset }: UserFriendlyErrorProps) {
  const errorInfo = getErrorInfo(error);
  
  const handleGoBack = () => {
    window.history.back();
  };
  
  const handleGoHome = () => {
    window.location.href = '/';
  };
  
  const handleContactSupport = () => {
    window.location.href = '/contact';
  };
  
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl">{errorInfo.title}</CardTitle>
              <CardDescription>{errorInfo.message}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorInfo.suggestion && (
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>What can you do?</AlertTitle>
              <AlertDescription>{errorInfo.suggestion}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-wrap gap-3">
            {errorInfo.canRetry && onRetry && (
              <Button onClick={onRetry} className="flex-1 min-w-[140px]">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            {errorInfo.action && (
              <Button
                onClick={errorInfo.action.onClick}
                variant="default"
                className="flex-1 min-w-[140px]"
              >
                {errorInfo.action.label}
              </Button>
            )}
            
            {errorInfo.canGoBack && (
              <Button onClick={handleGoBack} variant="outline" className="flex-1 min-w-[140px]">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            )}
            
            {errorInfo.canGoHome && (
              <Button onClick={handleGoHome} variant="outline" className="flex-1 min-w-[140px]">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
          
          {errorInfo.showSupport && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Still having trouble? Our support team is here to help.
              </p>
              <Button onClick={handleContactSupport} variant="secondary" size="sm">
                Contact Support
              </Button>
            </div>
          )}
          
          {import.meta.env.DEV && (
            <details className="mt-4 p-3 bg-muted rounded-lg">
              <summary className="cursor-pointer text-sm font-medium">
                Technical Details (Development Only)
              </summary>
              <pre className="mt-2 text-xs overflow-auto">
                {error.stack || error.message}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Error boundary component
import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }
  
  reset = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      
      return (
        <UserFriendlyError
          error={this.state.error}
          onRetry={this.reset}
          onReset={this.reset}
        />
      );
    }
    
    return this.props.children;
  }
}
