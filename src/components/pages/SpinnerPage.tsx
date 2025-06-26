import { Spinner } from "@heroui/react";

export default function SpinnerPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" label="Loading..." />
    </div>
  );
}
