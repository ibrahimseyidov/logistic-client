// Mock actions for contact persons since API might not exist yet
export interface ContactPersonRow {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  position: string;
  company: string;
}

let mockContacts: ContactPersonRow[] = [
  { id: "1", fullName: "Nicat Namazov", phone: "+994 50 285 75 58", email: "nicat@example.com", position: "Manager", company: "Limon Dental MMC" },
  { id: "2", fullName: "SINDU", phone: "+971 52 392 20 04", email: "sindu@example.com", position: "Director", company: "Ziyafreight" },
  { id: "3", fullName: "Fazil İsmayılzadə", phone: "+994 55 409 87 61", email: "fazil@example.com", position: "Agent", company: "Kapital Bank" },
];

export async function fetchContactPersonsAction(): Promise<ContactPersonRow[]> {
  return new Promise((resolve) => setTimeout(() => resolve([...mockContacts]), 300));
}

export async function createContactPersonAction(data: Omit<ContactPersonRow, "id">): Promise<ContactPersonRow> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newContact = { ...data, id: Date.now().toString() };
      mockContacts = [newContact, ...mockContacts];
      resolve(newContact);
    }, 300);
  });
}

export async function updateContactPersonAction(id: string, data: Partial<ContactPersonRow>): Promise<ContactPersonRow> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockContacts.findIndex(c => c.id === id);
      if (index === -1) return reject(new Error("Contact not found"));
      mockContacts[index] = { ...mockContacts[index], ...data };
      resolve(mockContacts[index]);
    }, 300);
  });
}

export async function deleteContactPersonAction(id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockContacts = mockContacts.filter(c => c.id !== id);
      resolve();
    }, 300);
  });
}
