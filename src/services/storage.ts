import { ChatEvent } from "../types";

const MAX_SESSION_MESSAGES = 10;

export class StorageService {
  private sessionMap: Map<string, ChatEvent[]>;

  constructor() {
    this.sessionMap = new Map();
  }

  appendEvent(sessionId: string, event: ChatEvent) {
    if (!this.sessionMap.has(sessionId)) {
      this.sessionMap.set(sessionId, []);
    }

    const session = this.sessionMap.get(sessionId)!;

    if (session.length >= MAX_SESSION_MESSAGES) {
      session.shift();
    }

    session.push(event);
  }

  getSessionEvents(sessionId: string): ChatEvent[] {
    return [...(this.sessionMap.get(sessionId) ?? [])];
  }

  clearSession(sessionId: string) {
    this.sessionMap.delete(sessionId);
  }
}

export const storageService = new StorageService();
