export function orderedParticipantIds(
  userIdA: string,
  userIdB: string,
): { participantLowId: string; participantHighId: string } {
  if (userIdA === userIdB) {
    throw new Error('Cannot create conversation with self');
  }
  return userIdA < userIdB
    ? { participantLowId: userIdA, participantHighId: userIdB }
    : { participantLowId: userIdB, participantHighId: userIdA };
}

export function otherParticipantId(
  conversation: { participantLowId: string; participantHighId: string },
  userId: string,
): string {
  return conversation.participantLowId === userId
    ? conversation.participantHighId
    : conversation.participantLowId;
}
