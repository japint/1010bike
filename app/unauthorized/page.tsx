import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unauthorized Access",
};

const UnauthorizedPage = () => {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center h-[calc(100vh-4rem)] space-y-4">
      <h1 className="h1-bold text-4xl">Unauthorized Access</h1>
      <p>You do not have permission to view this page.</p>
      <Button asChild>
        <Link href="/">Go to Home</Link>
      </Button>
    </div>
  );
};

export default UnauthorizedPage;
