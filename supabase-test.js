import { getSupabase, getCurrentUser } from './supabase-config.js';

// Test Supabase connection
async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const supabase = getSupabase();
    console.log('✓ Supabase client created successfully');
    
    // Test authentication status
    const user = await getCurrentUser();
    console.log('Current user:', user);
    
    if (user) {
      console.log('✓ User is authenticated');
    } else {
      console.log('ℹ No user is currently authenticated');
    }
    
    // Test a simple query to check database connection
    const { data, error } = await supabase
      .from('sistem_ayarlari')
      .select('anahtar, deger')
      .limit(1);
    
    if (error) {
      console.error('✗ Error querying database:', error);
      return false;
    }
    
    console.log('✓ Database connection successful');
    console.log('Sample data from sistem_ayarlari:', data);
    
    return true;
  } catch (error) {
    console.error('✗ Error testing Supabase connection:', error);
    return false;
  }
}

// Run the test
testSupabaseConnection().then(success => {
  if (success) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed.');
  }
});