// src/services/conferenceLocal.ts

const KEY = "mk_joined_conferences";

export function getLocalJoinedConferences(): string[] {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function saveLocalJoinedConference(id: string) {
  const list = new Set(getLocalJoinedConferences());
  list.add(id);
  localStorage.setItem(KEY, JSON.stringify([...list]));
}

export function hasJoinedConferences() {
  return getLocalJoinedConferences().length > 0;
}