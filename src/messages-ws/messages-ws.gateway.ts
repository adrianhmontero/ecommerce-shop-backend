import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;
  constructor(private readonly messagesWsService: MessagesWsService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.headers.authorization as string;
    console.log({ token });
    this.messagesWsService.registerClient(client);
    this.wss.emit(
      'clients-updated',
      this.messagesWsService.getConnectedClients(),
    );
  }
  handleDisconnect(client: any) {
    this.messagesWsService.removeClient(client.id);
    this.wss.emit(
      'clients-updated',
      this.messagesWsService.getConnectedClients(),
    );
  }

  @SubscribeMessage('message-from-client')
  handleMessageFromClient(client: Socket, payload: NewMessageDto) {
    //! Emite solo al cliente que mandó el mensaje
    /* client.emit('message-from-server', {
      fullName: 'jOHN dOE',
      message: payload.message || 'No message',
    }); */

    // Emite a TODOS los clientes, menos al que mandó el mensaje.
    /* client.broadcast.emit('message-from-server', {
      fullName: 'jOHN dOE',
      message: payload.message || 'No message',
    }); */

    this.wss.emit('message-from-server', {
      fullName: client.id,
      message: payload.message || 'No message',
    });
  }
}
