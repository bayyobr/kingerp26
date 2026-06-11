const supabaseUrl = 'https://wygvuhfmfhqrmejnhjkr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5Z3Z1aGZtZmhxcm1lam5oamtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NzQzMTMsImV4cCI6MjA4MzE1MDMxM30.nedOWDpLXBHNTOQ5LhjleNoACSnT57hqB3DjUk5DiNM';

async function fetchSchema() {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const schema = await response.json();
        console.log(JSON.stringify(schema, null, 2).substring(0, 1500));
    } catch (err) {
        console.error('Error:', err);
    }
}

fetchSchema();
