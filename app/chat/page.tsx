"use client";

import { initializeApp } from "firebase/app";
import {
  DocumentData,
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  limit,
  onSnapshot,
  orderBy,
  startAfter,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

initializeApp({
  apiKey: "AIzaSyA1mp3N20p0xFDj2WKxaZDImNf2obbtZMs",
  authDomain: "ekvj-chat.firebaseapp.com",
  projectId: "ekvj-chat",
  storageBucket: "ekvj-chat.appspot.com",
  messagingSenderId: "162746462712",
  appId: "1:162746462712:web:3eb657c3c319b61ea0a60d",
});

type Message = {
  id: string;
  name: string;
  body: string;
  created: Date;
};

const mapMessage = (doc: DocumentData): Message => ({
  id: doc.id,
  ...doc.data(),
  created: (doc.data().created as any).toDate(),
});

const collectionName = "ekvj_messages";
const limitCount = 25;

export default function Page() {
  const name = useSearchParams().get("name");
  const [{ body, fetching, more, olderMessages, newerMessages }, setState] =
    useState({
      body: "",
      fetching: true,
      more: true,
      olderMessages: undefined as Message[] | undefined,
      newerMessages: undefined as Message[] | undefined,
    });
  const buildQuery = useCallback(
    () =>
      query(
        collection(getFirestore(), collectionName),
        limit(limitCount),
        orderBy("created", "desc")
      ),
    []
  );
  useEffect(() => {
    getDocs(buildQuery()).then((snapshot) =>
      setState((state) => ({
        ...state,
        fetching: false,
        more: snapshot.docs.length === limitCount,
        olderMessages: snapshot.docs.map(mapMessage),
      }))
    );
    onSnapshot(buildQuery(), (snapshot) =>
      setState((state) => ({
        ...state,
        newerMessages: snapshot.docs.map(mapMessage),
      }))
    );
  }, [buildQuery]);
  const fetchMoreMessages = useCallback(async () => {
    setState((state) => ({ ...state, fetching: true }));
    await getDocs(
      query(
        buildQuery(),
        startAfter(olderMessages![olderMessages!.length - 1].created)
      )
    ).then((snapshot) =>
      setState((state) => ({
        ...state,
        fetching: false,
        more: snapshot.docs.length === limitCount,
        olderMessages: [
          ...(state.olderMessages ?? []),
          ...snapshot.docs.map(mapMessage),
        ],
      }))
    );
  }, [buildQuery, olderMessages]);
  const sendMessage = useCallback(async () => {
    if (!body.trim()) return;
    setState((state) => ({ ...state, body: "" }));
    await addDoc(collection(getFirestore(), collectionName), {
      name,
      body,
      created: new Date(),
    });
  }, [name, body]);
  const messages = useMemo(() => {
    if (olderMessages) {
      const ids = new Set(olderMessages.map((m) => m.id));
      return [
        ...(newerMessages?.filter((m) => !ids.has(m.id)) ?? []),
        ...olderMessages,
      ].reverse();
    }
  }, [olderMessages, newerMessages]);
  const loaded = !!messages;
  useEffect(() => {
    if (loaded) {
      window.scrollTo(0, document.body.scrollHeight);
    }
  }, [loaded]);
  return (
    <main>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {fetching ? (
          <div>Loading...</div>
        ) : more ? (
          <button onClick={fetchMoreMessages}>Load more messages</button>
        ) : null}
        {messages?.map((message) => (
          <div key={message.id}>
            <small>{message.created.toLocaleString()}</small>
            {` `}
            <strong>{message.name}</strong>: {message.body}
          </div>
        ))}
      </div>
      <div>
        <textarea
          value={body}
          onChange={(e) =>
            setState((state) => ({ ...state, body: e.target.value }))
          }
        />
        <button onClick={sendMessage}>Send message</button>
      </div>
    </main>
  );
}
