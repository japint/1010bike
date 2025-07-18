"use server";
import {
  shippingAddressSchema,
  signInFormSchema,
  signUpFormSchema,
} from "@/lib/validators";
import { auth, signIn, signOut } from "@/auth";
import { hashSync } from "bcrypt-ts-edge";
import { prisma } from "@/db/prisma";
import { formatError } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// sign in user with credentials
export async function signInWWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    await signIn("credentials", user);

    return { success: true, message: "Signed in successfully" };
  } catch (error) {
    // Check if it's a redirect error by checking the error properties
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    return { success: false, message: "Invalid email or password" };
  }
}

// sign out user
export async function signOutUser() {
  await signOut();
}

// sign up user
export async function signUpUser(prevState: unknown, formData: FormData) {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const plainPassword = user.password;

    // Hash the password before saving
    user.password = hashSync(user.password, 10);

    // Create user in the database
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
      },
    });

    await signIn("credentials", {
      email: user.email,
      password: plainPassword,
    });

    return { success: true, message: "User created successfully" };
  } catch (error) {
    // Check if it's a redirect error by checking the error properties
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    return { success: false, message: formatError(error) };
  }
}

// get user by ID
export async function getUserById(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });
  if (!user) throw new Error("User not found");
  return user;
}

// update the user's address
export async function updateUserAddress(
  data: z.infer<typeof shippingAddressSchema>
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const currentUser = await prisma.user.findFirst({
      where: { id: session.user.id },
    });

    if (!currentUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const address = shippingAddressSchema.parse(data);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { address },
    });

    // Revalidate relevant paths
    revalidatePath("/shipping-address");
    revalidatePath("/payment-method");

    return { success: true, message: "Address updated successfully" };
  } catch (error) {
    console.error("Update address error:", error);
    return { success: false, message: formatError(error) };
  }
}
