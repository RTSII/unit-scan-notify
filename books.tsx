import React, { useState } from 'react';
import { SmartCombobox } from './src/components/smart-combo-box'; // fallback for IDEs
// For Vite/Next/CRA, use this if above fails:
// import { SmartCombobox } from 'src/components/smart-combo-box';

// Example categories/filters (replace with your actual categories)
const categories = [
  { id: 'all', label: 'All' },
  { id: 'fiction', label: 'Fiction' },
  { id: 'nonfiction', label: 'Non-Fiction' },
  { id: 'science', label: 'Science' },
  { id: 'history', label: 'History' },
  // ...add more as needed
];

const Books = () => {
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const [searchTerm, setSearchTerm] = useState('');

  // Handler for SmartComboBox selection
  const handleComboBoxChange = (value: string | string[] | null) => {
    if (Array.isArray(value)) {
      setSelectedCategory(value[0] || 'all');
    } else {
      setSelectedCategory(value || 'all');
    }
  };

  // Handler for search input in SmartComboBox
  const handleComboBoxInput = (input: string) => {
    setSearchTerm(input);
    // Optionally, trigger search logic here
  };

  // Replace the placeholder books array with your actual books data.
  // Example:
  const books = [
    { id: 1, title: 'A Brief History of Time', category: 'science' },
    { id: 2, title: 'To Kill a Mockingbird', category: 'fiction' },
    { id: 3, title: 'Sapiens', category: 'nonfiction' },
    { id: 4, title: '1984', category: 'fiction' },
    { id: 5, title: 'The Selfish Gene', category: 'science' },
    { id: 6, title: 'Guns, Germs, and Steel', category: 'history' },
    // ...add more books as needed
  ];

  // Example filter logic:
  const filteredBooks = books.filter(book => {
    const matchesCategory =
      selectedCategory === 'all' ||
      book.category === selectedCategory;
    const matchesSearch =
      searchTerm === '' ||
      book.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      {/* SmartCombobox replaces both search and filter UI */}
      <SmartCombobox
        options={categories}
        value={selectedCategory}
        onValueChange={handleComboBoxChange}
        placeholder="Search or select category"
        // ...add any additional props as needed
      />

      {/* Render filtered books */}
      <ul>
        {filteredBooks.map(book => (
          <li key={book.id}>{book.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default Books;