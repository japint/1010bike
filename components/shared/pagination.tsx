"use client";

import { formUrlQuery } from "@/lib/utils";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
}

const Pagination = ({ page, totalPages }: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleClick = (btnType: string) => {
    const pageValue = btnType === "next" ? page + 1 : page - 1;

    const queryString = formUrlQuery({
      params: searchParams.toString(),
      key: "page",
      value: pageValue.toString(),
    });

    // Build the full URL
    const newUrl = `${pathname}?${queryString}`;
    router.push(newUrl);
  };

  return (
    <div className="flex gap-2">
      <Button
        disabled={page <= 1}
        onClick={() => handleClick("prev")}
        variant="outline"
        className="w-28"
      >
        Previous
      </Button>

      <span className="flex items-center px-4">
        Page {page} of {totalPages}
      </span>

      <Button
        disabled={page >= totalPages}
        onClick={() => handleClick("next")}
        variant="outline"
        className="w-28"
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
