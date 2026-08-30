export const SOCKET_ROOMS = {
  driver: (driverId: string) => `driver:${driverId}`,
  shipper: (shipperId: string) => `shipper:${shipperId}`,
  booking: (bookingId: string) => `booking:${bookingId}`,
  chat: (bookingId: string) => `chat:${bookingId}`,
};

export const SOCKET_EVENTS = {
  
  BOOK_CARGO: 'book-cargo',
  DISPATCH_QUEUED: 'dispatch-queued',
  INCOMING_BID: 'incoming-bid',
  ACCEPT_BID: 'accept-bid',
  BID_ACCEPTED: 'bid-accepted',
  REJECT_BID: 'reject-bid',
  BID_REJECTED: 'bid-rejected',
  NO_DRIVERS: 'no-drivers',
  BOOKING_ACCEPTED: 'booking-accepted',
  BOOKING_CANCELLED: 'booking-cancelled',

  
  COMMIT_SCHEDULED_JOB: 'commit-scheduled-job',
  SCHEDULED_JOB_COMMITTED: 'scheduled-job-committed',
  COMMIT_CONFIRMED: 'commit-confirmed',
  SCHEDULED_JOB_AVAILABLE: 'scheduled_job_available',

  
  DRIVER_LOCATION: 'driver:location',
  DRIVER_LOCATION_UPDATE: 'driver:location:update',
  START_TRIP: 'start:trip',
  STOP_TRIP_TRACKING: 'stop:trip:tracking',
  DRIVER_ARRIVED: 'driver:arrived',
  TRIP_COMPLETED: 'trip:completed',
  JOIN_BOOKING_TRACKING: 'join-booking-tracking',

  
  JOIN_CHAT: 'join-chat',
  SEND_CHAT_MESSAGE: 'send-chat-message',
  RECEIVE_CHAT_MESSAGE: 'receive-chat-message',

  
  ERROR: 'error',
} as const;
