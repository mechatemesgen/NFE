export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      opportunities: {
        Row: {
          id: number
          title: string
          description: string | null
          link: string | null
          deadline: string | null
          thumbnail: string | null
          tags: string[] | null
          created_at: string
          approved: boolean
          posted_to_telegram: boolean
        }
        Insert: {
          id?: number
          title: string
          description?: string | null
          link?: string | null
          deadline?: string | null
          thumbnail?: string | null
          tags?: string[] | null
          created_at?: string
          approved?: boolean
          posted_to_telegram?: boolean
        }
        Update: {
          id?: number
          title?: string
          description?: string | null
          link?: string | null
          deadline?: string | null
          thumbnail?: string | null
          tags?: string[] | null
          created_at?: string
          approved?: boolean
          posted_to_telegram?: boolean
        }
      }
      settings: {
        Row: {
          id: number
          key: string
          value: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          key: string
          value?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          key?: string
          value?: string | null
          updated_at?: string
        }
      }
    }
  }
}
