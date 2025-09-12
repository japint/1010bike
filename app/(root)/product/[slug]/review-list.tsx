"use client";

import { Review } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";

const ReviewList = ({
  userId,
  productId,
  productSlug,
}: {
  userId: string;
  productId: string;
  productSlug: string;
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  return (
    <div className="space-y-4">
      {reviews.length === 0 && (
        <div>No reviews yet. Be the first to review this product!</div>
      )}
      {userId ? (
        <div>
          {/* Review form goes here */}
          <h3 className="font-semibold">Write a Review</h3>
        </div>
      ) : (
        <div>
          Please
          <Link
            className="text-blue-500 hover:underline px-2"
            href={`/sign-in?callbackUrl=/product/${productSlug}`}
          >
            sign in
          </Link>
          to write a review.
        </div>
      )}
      <div className="flex flex-col gap-3">{/* Review list goes here */}</div>
    </div>
  );
};

export default ReviewList;
