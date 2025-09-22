import { importAllData } from './data-import';

// Run the data import
importAllData()
  .then(() => {
    console.log('✅ Data import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Data import failed:', error);
    process.exit(1);
  });