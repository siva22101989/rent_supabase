'use server';

import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  orderBy,
  deleteDoc,
  getDoc,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import {getFirestore} from 'firebase-admin/firestore';
import {adminDb} from '@/firebase/admin';
import type {Customer, StorageRecord, Payment} from '@/lib/definitions';
import {revalidateTag} from 'next/cache';
import {unstable_cache as cache} from 'next/cache';

function deconstructTimestamps(obj: any) {
  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] instanceof Timestamp) {
      newObj[key] = obj[key].toDate();
    } else {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}

export const customers = cache(
  async (): Promise<Customer[]> => {
    const db = adminDb;
    const customersCollection = collection(db, 'customers');
    const q = query(customersCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    const customers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...deconstructTimestamps(doc.data()),
    })) as Customer[];
    return customers;
  },
  ['customers'],
  {tags: ['customers']}
);

export const storageRecords = cache(
  async (): Promise<StorageRecord[]> => {
    const db = adminDb;
    const recordsCollection = collection(db, 'storageRecords');
    const q = query(
      recordsCollection,
      orderBy('storageStartDate', 'desc')
    );
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => {
      const data = deconstructTimestamps(doc.data());
      return {
        id: doc.id,
        ...data,
      } as StorageRecord;
    }) as StorageRecord[];
    return records;
  },
  ['storageRecords'],
  {tags: ['storageRecords']}
);

export const getStorageRecord = async (
  id: string
): Promise<StorageRecord | null> => {
  const db = adminDb;
  const docRef = doc(db, 'storageRecords', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...deconstructTimestamps(docSnap.data()),
    } as StorageRecord;
  } else {
    return null;
  }
};


export const getCustomer = async (
  id: string
): Promise<Customer | null> => {
  const db = adminDb;
  const docRef = doc(db, 'customers', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Customer;
  } else {
    return null;
  }
};


export const saveCustomer = async (customer: Omit<Customer, 'id'>) => {
  const db = adminDb;
  const docRef = await addDoc(collection(db, 'customers'), customer);
  revalidateTag('customers');
  return docRef.id;
};

export const saveStorageRecord = async (record: Omit<StorageRecord, 'id'>) => {
  const db = adminDb;
  const docRef = await addDoc(collection(db, 'storageRecords'), record);
  revalidateTag('storageRecords');
  return docRef.id;
}

export const updateStorageRecord = async (id: string, data: Partial<StorageRecord>) => {
    const db = adminDb;
    const docRef = doc(db, 'storageRecords', id);
    await setDoc(docRef, data, { merge: true });
    revalidateTag('storageRecords');
}

export const addPaymentToRecord = async (recordId: string, payment: Payment) => {
    const db = adminDb;
    const record = await getStorageRecord(recordId);
    if (!record) throw new Error('Record not found');

    const updatedPayments = record.payments ? [...record.payments, payment] : [payment];
    await updateStorageRecord(recordId, { payments: updatedPayments });
    revalidateTag('storageRecords');
}


// These functions are no longer used but kept for reference during transition
export const saveCustomers = async (data: Customer[]): Promise<void> => {
  console.warn('saveCustomers is deprecated. Use Firestore functions instead.');
};

export const saveStorageRecords = async (data: StorageRecord[]): Promise<void> => {
  console.warn('saveStorageRecords is deprecated. Use Firestore functions instead.');
};
