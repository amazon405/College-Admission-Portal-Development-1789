import supabase from '../lib/supabase';

// Table names with random suffix for security
const TABLES = {
  COLLEGES: 'colleges_data_jc9a7',
  INSTITUTES: 'institutes_jc9a7',
  PROGRAMS: 'programs_jc9a7',
  CATEGORIES: 'categories_jc9a7',
  ROUNDS: 'rounds_jc9a7'
};

// Fetch all data needed for the admin dashboard
export const fetchAllData = async () => {
  try {
    // Fetch all data in parallel for better performance
    const [collegesResponse, institutesResponse, programsResponse, categoriesResponse, roundsResponse] = await Promise.all([
      supabase.from(TABLES.COLLEGES).select('*').order('rank', { ascending: true }),
      supabase.from(TABLES.INSTITUTES).select('*').order('label', { ascending: true }),
      supabase.from(TABLES.PROGRAMS).select('*').order('label', { ascending: true }),
      supabase.from(TABLES.CATEGORIES).select('*').order('label', { ascending: true }),
      supabase.from(TABLES.ROUNDS).select('*').order('label', { ascending: true })
    ]);

    // Check for errors
    const errors = [];
    if (collegesResponse.error) errors.push(`Colleges: ${collegesResponse.error.message}`);
    if (institutesResponse.error) errors.push(`Institutes: ${institutesResponse.error.message}`);
    if (programsResponse.error) errors.push(`Programs: ${programsResponse.error.message}`);
    if (categoriesResponse.error) errors.push(`Categories: ${categoriesResponse.error.message}`);
    if (roundsResponse.error) errors.push(`Rounds: ${roundsResponse.error.message}`);

    if (errors.length > 0) {
      throw new Error(`Failed to fetch data: ${errors.join(', ')}`);
    }

    // Transform data to match the expected format in the frontend
    const transformedColleges = collegesResponse.data.map(college => ({
      id: college.id,
      rank: college.rank,
      instituteName: college.institute_name,
      instituteCode: college.institute_code,
      location: college.location,
      instituteType: college.institute_type,
      branch: college.branch,
      duration: college.duration,
      category: college.category,
      gender: college.gender,
      openingRank: college.opening_rank,
      closingRank: college.closing_rank,
      round: college.round,
      quota: college.quota,
      year: college.year
    }));

    return {
      colleges: transformedColleges,
      institutes: institutesResponse.data || [],
      programs: programsResponse.data || [],
      categories: categoriesResponse.data || [],
      rounds: roundsResponse.data || []
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Save all data to Supabase (bulk update)
export const saveAllData = async (data) => {
  try {
    const { colleges, institutes, programs, categories, rounds } = data;

    // Transform colleges data to match database schema
    const transformedColleges = colleges.map(college => ({
      id: college.id, // Preserve ID if it exists
      rank: college.rank,
      institute_name: college.instituteName,
      institute_code: college.instituteCode,
      location: college.location,
      institute_type: college.instituteType,
      branch: college.branch,
      duration: college.duration,
      category: college.category,
      gender: college.gender,
      opening_rank: college.openingRank,
      closing_rank: college.closingRank,
      round: college.round,
      quota: college.quota || 'AI',
      year: college.year || '2025'
    }));

    // Use upsert to handle both inserts and updates
    const responses = await Promise.all([
      supabase.from(TABLES.COLLEGES).upsert(transformedColleges),
      supabase.from(TABLES.INSTITUTES).upsert(institutes),
      supabase.from(TABLES.PROGRAMS).upsert(programs),
      supabase.from(TABLES.CATEGORIES).upsert(categories),
      supabase.from(TABLES.ROUNDS).upsert(rounds)
    ]);

    // Check for errors
    const errors = responses
      .map((response, index) => response.error ? `${Object.keys(TABLES)[index]}: ${response.error.message}` : null)
      .filter(Boolean);

    if (errors.length > 0) {
      throw new Error(`Failed to save data: ${errors.join(', ')}`);
    }

    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
};

// Delete item by ID from specific table
export const deleteItem = async (table, id) => {
  try {
    const tableKey = Object.keys(TABLES).find(key => TABLES[key] === table);
    if (!tableKey) throw new Error(`Invalid table: ${table}`);
    
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error deleting item from ${table}:`, error);
    throw error;
  }
};

// Update item in specific table
export const updateItem = async (table, id, data) => {
  try {
    const tableKey = Object.keys(TABLES).find(key => TABLES[key] === table);
    if (!tableKey) throw new Error(`Invalid table: ${table}`);
    
    // For colleges, transform the data
    let transformedData = data;
    if (table === TABLES.COLLEGES) {
      transformedData = {
        rank: data.rank,
        institute_name: data.instituteName,
        institute_code: data.instituteCode,
        location: data.location,
        institute_type: data.instituteType,
        branch: data.branch,
        duration: data.duration,
        category: data.category,
        gender: data.gender,
        opening_rank: data.openingRank,
        closing_rank: data.closingRank,
        round: data.round,
        quota: data.quota || 'AI',
        year: data.year || '2025'
      };
    }
    
    const { error } = await supabase.from(table).update(transformedData).eq('id', id);
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error updating item in ${table}:`, error);
    throw error;
  }
};

// Add new item to specific table
export const addItem = async (table, data) => {
  try {
    const tableKey = Object.keys(TABLES).find(key => TABLES[key] === table);
    if (!tableKey) throw new Error(`Invalid table: ${table}`);
    
    // For colleges, transform the data
    let transformedData = data;
    if (table === TABLES.COLLEGES) {
      transformedData = {
        rank: data.rank,
        institute_name: data.instituteName,
        institute_code: data.instituteCode,
        location: data.location,
        institute_type: data.instituteType,
        branch: data.branch,
        duration: data.duration,
        category: data.category,
        gender: data.gender,
        opening_rank: data.openingRank,
        closing_rank: data.closingRank,
        round: data.round,
        quota: data.quota || 'AI',
        year: data.year || '2025'
      };
    }
    
    const { error, data: newItem } = await supabase.from(table).insert(transformedData).select().single();
    if (error) throw error;
    
    return newItem;
  } catch (error) {
    console.error(`Error adding item to ${table}:`, error);
    throw error;
  }
};

// Process CSV data - transform and save to appropriate tables
export const processCSVData = async (csvData) => {
  try {
    // Extract unique institutes, programs, categories, and rounds
    const institutes = new Set();
    const programs = new Set();
    const categories = new Set();
    const rounds = new Set();
    
    // Transform the CSV data to match our database schema
    const transformedColleges = csvData.map((row, index) => {
      const instituteCode = generateInstituteCode(row.College);
      const instituteType = determineInstituteType(row.College);
      const location = extractLocation(row.College);
      const duration = extractDuration(row.Couse);
      const programCode = generateProgramCode(row.Couse);
      const category = row['Seat Type'] || 'OPEN';
      const round = `Round-${row.Round || '1'}`;
      const year = row.Year || '2025';
      
      // Add to sets for unique values
      institutes.add(JSON.stringify({
        value: instituteCode,
        label: row.College,
        type: instituteType,
        location: location
      }));
      
      programs.add(JSON.stringify({
        value: programCode,
        label: row.Couse,
        duration: duration,
        degree: extractDegree(row.Couse)
      }));
      
      categories.add(JSON.stringify({
        value: category,
        label: category,
        description: getCategoryDescription(category)
      }));
      
      rounds.add(JSON.stringify({
        value: round,
        label: `Round ${row.Round || '1'}`,
        year: year,
        status: 'Completed'
      }));
      
      // Return transformed college entry
      return {
        rank: index + 1, // Generate sequential rank
        institute_name: row.College,
        institute_code: instituteCode,
        location: location,
        institute_type: instituteType,
        branch: row.Couse,
        duration: duration,
        category: category,
        gender: row.Gender || 'Gender-Neutral',
        opening_rank: parseInt(row['Opening Rank']) || 0,
        closing_rank: parseInt(row['Closing Rank']) || 0,
        round: round,
        quota: row.Quota || 'AI',
        year: year
      };
    });
    
    // Convert sets to arrays and parse JSON
    const institutesArray = Array.from(institutes).map(item => JSON.parse(item));
    const programsArray = Array.from(programs).map(item => JSON.parse(item));
    const categoriesArray = Array.from(categories).map(item => JSON.parse(item));
    const roundsArray = Array.from(rounds).map(item => JSON.parse(item));
    
    // Save all data to respective tables
    const responses = await Promise.all([
      supabase.from(TABLES.COLLEGES).upsert(transformedColleges),
      supabase.from(TABLES.INSTITUTES).upsert(institutesArray),
      supabase.from(TABLES.PROGRAMS).upsert(programsArray),
      supabase.from(TABLES.CATEGORIES).upsert(categoriesArray),
      supabase.from(TABLES.ROUNDS).upsert(roundsArray)
    ]);
    
    // Check for errors
    const errors = responses
      .map((response, index) => response.error ? `${Object.keys(TABLES)[index]}: ${response.error.message}` : null)
      .filter(Boolean);
    
    if (errors.length > 0) {
      throw new Error(`Failed to save data: ${errors.join(', ')}`);
    }
    
    // Return counts of records saved
    return {
      colleges: transformedColleges.length,
      institutes: institutesArray.length,
      programs: programsArray.length,
      categories: categoriesArray.length,
      rounds: roundsArray.length
    };
  } catch (error) {
    console.error('Error processing CSV data:', error);
    throw error;
  }
};

// Helper functions for data transformation
const generateInstituteCode = (collegeName) => {
  if (collegeName.includes('IIT')) {
    const match = collegeName.match(/IIT\s+(\w+)/i);
    return match ? `IIT${match[1].substring(0,3).toUpperCase()}` : 'IIT001';
  }
  if (collegeName.includes('NIT')) {
    const match = collegeName.match(/NIT\s+(\w+)/i);
    return match ? `NIT${match[1].substring(0,3).toUpperCase()}` : 'NIT001';
  }
  if (collegeName.includes('IIIT')) {
    const match = collegeName.match(/IIIT\s+(\w+)/i);
    return match ? `IIIT${match[1].substring(0,3).toUpperCase()}` : 'IIIT001';
  }
  return 'INST001';
};

const extractLocation = (collegeName) => {
  const locations = {
    'Bombay': 'Mumbai, Maharashtra',
    'Delhi': 'New Delhi, Delhi',
    'Madras': 'Chennai, Tamil Nadu',
    'Kanpur': 'Kanpur, Uttar Pradesh',
    'Kharagpur': 'Kharagpur, West Bengal',
    'Roorkee': 'Roorkee, Uttarakhand',
    'Guwahati': 'Guwahati, Assam',
    'Hyderabad': 'Hyderabad, Telangana',
    'Bhubaneswar': 'Bhubaneswar, Odisha',
    'Indore': 'Indore, Madhya Pradesh'
  };

  for (const [key, value] of Object.entries(locations)) {
    if (collegeName.includes(key)) {
      return value;
    }
  }
  return 'India';
};

const determineInstituteType = (collegeName) => {
  if (collegeName.includes('IIT')) return 'IIT';
  if (collegeName.includes('NIT')) return 'NIT';
  if (collegeName.includes('IIIT')) return 'IIIT';
  if (collegeName.includes('IIEST')) return 'IIEST';
  return 'GFTI';
};

const extractDuration = (courseName) => {
  if (courseName.includes('4 Years')) return '4 Years';
  if (courseName.includes('5 Years')) return '5 Years';
  if (courseName.includes('3 Years')) return '3 Years';
  if (courseName.includes('2 Years')) return '2 Years';
  return '4 Years';
};

const extractDegree = (courseName) => {
  if (courseName.includes('Bachelor of Technology')) return 'B.Tech';
  if (courseName.includes('Bachelor of Science')) return 'B.Sc';
  if (courseName.includes('Bachelor of Architecture')) return 'B.Arch';
  if (courseName.includes('Master of Technology')) return 'M.Tech';
  if (courseName.includes('Master of Science')) return 'M.Sc';
  return 'B.Tech';
};

const generateProgramCode = (courseName) => {
  // Generate a simple hash-based code
  let hash = 0;
  for (let i = 0; i < courseName.length; i++) {
    const char = courseName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString().substring(0, 4);
};

const getCategoryDescription = (category) => {
  const descriptions = {
    'OPEN': 'General Category',
    'EWS': 'Economically Weaker Section',
    'OBC-NCL': 'Other Backward Classes - Non Creamy Layer',
    'SC': 'Scheduled Caste',
    'ST': 'Scheduled Tribe',
    'OPEN (PwD)': 'General Category - Persons with Disability',
    'EWS (PwD)': 'EWS - Persons with Disability',
    'OBC-NCL (PwD)': 'OBC-NCL - Persons with Disability',
    'SC (PwD)': 'SC - Persons with Disability',
    'ST (PwD)': 'ST - Persons with Disability'
  };
  return descriptions[category] || category;
};

// Export table names for reference
export const TableNames = TABLES;