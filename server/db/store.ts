import fs from 'fs';
import path from 'path';

// Robust local JSON/in-memory store with Mongoose-like querying & persistence
export interface DocumentBase {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export class Collection<T extends DocumentBase> {
  private name: string;
  private filePath: string;
  private documents: Map<string, T> = new Map();

  constructor(name: string) {
    this.name = name;
    const dataDir = path.resolve(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        // Fallback to memory
      }
    }
    this.filePath = path.join(dataDir, `${name}.json`);
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const list: T[] = JSON.parse(raw);
        list.forEach((doc) => this.documents.set(doc._id, doc));
      }
    } catch (err) {
      console.warn(`[Store] Could not load ${this.name}, using empty map`, err);
    }
  }

  private save() {
    try {
      const list = Array.from(this.documents.values());
      fs.writeFileSync(this.filePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      // Memory fallback if disk write is restricted
    }
  }

  async find(query: Record<string, any> = {}): Promise<T[]> {
    const list = Array.from(this.documents.values());
    if (Object.keys(query).length === 0) return list;

    return list.filter((doc) => {
      for (const [key, val] of Object.entries(query)) {
        if (val && typeof val === 'object' && '$in' in val) {
          if (!val.$in.includes(doc[key])) return false;
        } else if (val && typeof val === 'object' && '$regex' in val) {
          const reg = new RegExp(val.$regex, val.$options || 'i');
          if (!reg.test(String(doc[key] || ''))) return false;
        } else if (doc[key] !== val) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query: Record<string, any>): Promise<T | null> {
    const results = await this.find(query);
    return results[0] || null;
  }

  async findById(id: string): Promise<T | null> {
    return this.documents.get(id) || null;
  }

  async create(data: Omit<T, '_id' | 'createdAt' | 'updatedAt'> & { _id?: string }): Promise<T> {
    const now = new Date().toISOString();
    const id = data._id || `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const doc = {
      ...data,
      _id: id,
      createdAt: now,
      updatedAt: now,
    } as unknown as T;

    this.documents.set(id, doc);
    this.save();
    return doc;
  }

  async findByIdAndUpdate(id: string, update: Partial<T>): Promise<T | null> {
    const existing = this.documents.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...update,
      _id: id,
      updatedAt: new Date().toISOString(),
    };
    this.documents.set(id, updated);
    this.save();
    return updated;
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    const existing = this.documents.get(id);
    if (!existing) return null;
    this.documents.delete(id);
    this.save();
    return existing;
  }

  async deleteMany(query: Record<string, any>): Promise<number> {
    const toDelete = await this.find(query);
    toDelete.forEach((doc) => this.documents.delete(doc._id));
    if (toDelete.length > 0) this.save();
    return toDelete.length;
  }

  async countDocuments(query: Record<string, any> = {}): Promise<number> {
    const results = await this.find(query);
    return results.length;
  }

  async clear(): Promise<void> {
    this.documents.clear();
    this.save();
  }
}
