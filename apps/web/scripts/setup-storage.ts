
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials!');
        process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
        console.log('Checking storage buckets...');
        const { data: buckets, error } = await supabase.storage.listBuckets();

        if (error) {
                console.error('Error listing buckets:', error);
                return;
        }

        const imagesBucket = buckets.find(b => b.name === 'images');

        if (imagesBucket) {
                console.log('✅ "images" bucket already exists.');
        } else {
                console.log('⚠️ "images" bucket missing. Creating...');
                const { data, error: createError } = await supabase.storage.createBucket('images', {
                        public: true,
                        fileSizeLimit: 5242880, // 5MB
                        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
                });

                if (createError) {
                        console.error('❌ Failed to create bucket:', createError);
                } else {
                        console.log('✅ "images" bucket created successfully.');
                }
        }
}

setupStorage();
