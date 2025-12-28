import { Injectable } from "@nestjs/common";
import { UserService } from "./../users/services/user.service";
import { StripeService } from "../stripe/stripe.service";
import Stripe from "stripe";

@Injectable()
export class RideService {
  constructor(
    private readonly userService: UserService,
    private readonly stripeService: StripeService
  ) {}

  async createRideRequest(riderId: string, pickup: string, drop: string) {
    const rider = this.userService.findUser(riderId);
    if (!rider) throw new Error("Rider not found");

    // Lock basic fee with Stripe (manual capture)
    const paymentIntent = await this.stripeService.createRidePaymentIntent(
      riderId,
      5000
    );

    const ride = {
      id: (Math.random() * 1000000).toFixed(0),
      riderId,
      pickup,
      drop,
      status: "pending",
      paymentIntentId: paymentIntent.id,
    };

    // Here you would save ride to DB
    return ride;
  }

  async acceptRide(rideId: string, driverId: string) {
    // Update ride status
    const ride = { rideId, driverId, status: "accepted" };
    // Update DB in real app
    return ride;
  }

  async updateRideCharges(rideId: string, newAmount: number) {
    // Update Stripe PaymentIntent
    return this.stripeService.updateRidePaymentIntent(rideId, newAmount);
  }

 async completeRide(
  ridePaymentIntentId: string,
  driverId: string,
  driverAmount: number
) {
  const captured = await this.stripeService.captureRidePayment(ridePaymentIntentId);

  // Use latest_charge instead of digging into the charges array
  const chargeId = captured.latest_charge;

  if (!chargeId) {
    throw new Error("No charge found on the captured PaymentIntent");
  }

  // Pay the driver using the charge ID directly
  return this.stripeService.payDriver(
    driverId,
    driverAmount,
    captured.currency,
    chargeId as string // Casting to string if TS infers it as Charge | string
  );
}
}
