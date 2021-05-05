/*
 * getConnectedMembers - get member names that are currently connected to the server socket.
 *  this function returns an array of strings
 */
export const getConnectedMembers = (
  accessors: Record<string, number>
): string[] => Object.keys(accessors).filter(user => accessors[user] > 0);
