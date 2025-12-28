import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RideService } from '../ride/ride.service';

@WebSocketGateway({ cors: true })
export class SocketsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly rideService: RideService) {}

  @SubscribeMessage('request_ride')
  async handleRideRequest(
    @MessageBody() data: { riderId: string; pickup: string; drop: string },
    @ConnectedSocket() client: Socket,
  ) {
    const ride = await this.rideService.createRideRequest(data.riderId, data.pickup, data.drop);

    // Notify available drivers
    this.server.emit('new_ride', ride);

    // Respond to rider
    client.emit('ride_requested', ride);
  }

  @SubscribeMessage('accept_ride')
  async handleAcceptRide(
    @MessageBody() data: { rideId: string; driverId: string },
  ) {
    const ride = await this.rideService.acceptRide(data.rideId, data.driverId);

    // Notify rider
    this.server.to(data.rideId).emit('ride_accepted', ride);

    // Broadcast driver info if needed
    this.server.emit('ride_assigned', ride);
  }

  @SubscribeMessage('update_ride_charges')
  async handleUpdateCharges(@MessageBody() data: { rideId: string; newAmount: number }) {
    const updated = await this.rideService.updateRideCharges(data.rideId, data.newAmount);
    this.server.emit('ride_charges_updated', updated);
  }

  @SubscribeMessage('complete_ride')
  async handleCompleteRide(
    @MessageBody() data: { rideId: string; driverId: string; driverAmount: number },
  ) {
    const result = await this.rideService.completeRide(data.rideId, data.driverId, data.driverAmount);
    this.server.emit('ride_completed', result);
  }
}
