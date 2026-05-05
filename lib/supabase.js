import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const supabase = createClient(
  "https://smelhjszcbccvpfvaliq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZWxoanN6Y2JjY3ZwZnZhbGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDY5ODYsImV4cCI6MjA5MTY4Mjk4Nn0.iVcoEzDHtKQkzsGWZsg4WkhNAxemPt8P6F5z2yKtHoE",
  {
    auth: {
      storage: AsyncStorage, // persist sessions on device
      autoRefreshToken: true,
      persistSession: true,
    },
  },
);
