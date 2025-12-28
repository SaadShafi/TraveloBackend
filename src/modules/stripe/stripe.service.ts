import { Injectable } from "@nestjs/common";
import Stripe from "stripe";
import { UserService } from "../users/services/user.service";
import { CreateSubscriptionResponse } from "./interfaces/create-subscription-response.interface";

export class StripeService {
  private readonly stripe: Stripe;
  private readonly productId: string;
  private userService: UserService;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const productId = process.env.STRIPE_PRODUCT_ID;

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not defined");
    }
    if (!productId) {
      throw new Error("STRIPE_PRODUCT_ID is not defined");
    }

    this.productId = productId;

    this.stripe = new Stripe(secretKey, {
      apiVersion: "2025-11-17.clover",
    });
  }

  async createCustomer(data: { email: string; userId: string }) {
    let customer = await this.stripe.customers.create({ email: data.email });
    const stripeCustomerId = customer.id;
    let userUpdateData = { stripeCustomerId: stripeCustomerId };
    await this.userService.updateUserData(data.userId, userUpdateData);

    return customer;
  }

  async createDynamicWeeklySubscription(data: {
    customerId: string;
    amountInCents: number;
  }): Promise<CreateSubscriptionResponse> {
    let subscription = await this.stripe.subscriptions.create(
      {
        customer: data.customerId,
        items: [
          {
            price_data: {
              currency: "usd",
              product: this.productId,
              recurring: { interval: "week" },
              unit_amount: data.amountInCents,
            },
          },
        ],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        expand: ["latest_invoice.payment_intent"],
      },
      {
        idempotencyKey: `weekly-${data.customerId}-${data.amountInCents}`,
      }
    );

    const invoice = subscription.latest_invoice as Stripe.Invoice;

    if (!invoice) {
      throw new Error("Invoice missing");
    }

    if (!("payment_intent" in invoice) || !invoice.payment_intent) {
      throw new Error("PaymentIntent not found on invoice");
    }

    const paymentIntent =
      typeof invoice.payment_intent === "string"
        ? await this.stripe.paymentIntents.retrieve(invoice.payment_intent)
        : (invoice.payment_intent as Stripe.PaymentIntent);

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    };
  }

  // Step 1: Create PaymentIntent for initial fee (manual capture)
  async createRidePaymentIntent(
    riderStripeCustomerId: string,
    amount: number,
    currency = "usd"
  ) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency,
      customer: riderStripeCustomerId, // optional
      payment_method_types: ["card"],
      capture_method: "manual", // manual capture
    });

    return paymentIntent;
  }

  // Step 2: Update PaymentIntent with extra charges
  async updateRidePaymentIntent(paymentIntentId: string, newAmount: number) {
    const updated = await this.stripe.paymentIntents.update(paymentIntentId, {
      amount: newAmount,
    });

    return updated;
  }

  // Step 3: Capture the final payment
  async captureRidePayment(
    paymentIntentId: string,
    options?: Stripe.PaymentIntentCaptureParams
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.capture(paymentIntentId, {
      ...options,
      expand: ["charges"],
    });
  }

  // Step 4: Pay the driver (Stripe Connect)
  async payDriver(
    driverAccountId: string,
    amount: number,
    currency: string,
    chargeId: string
  ) {
    const transfer = await this.stripe.transfers.create({
      amount,
      currency,
      destination: driverAccountId, // connected account
      source_transaction: chargeId, // link to captured charge
    });

    return transfer;
  }
}
