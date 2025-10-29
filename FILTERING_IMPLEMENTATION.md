# Filter/Search Implementation Documentation

## Overview
This document explains the implementation of the filter/search functionality for the LMS platform, supporting both "Explore" and "Keyword" modes.

## Backend Implementation

### API Endpoints Enhanced

#### 1. Materials API (`/api/materials`)
- **Method**: GET
- **Query Parameters**:
  - `category` - Room/Category filter
  - `subCategory` - Sub Category filter (maps to tags)
  - `theme` - Theme/Genre filter (maps to tags/category)
  - `level` - Level filter (maps to tags/category)
  - `country` - Country filter (maps to tags/category)
  - `keyword` - Keyword search across title, description, tags, category
  - `page` - Pagination page number (default: 1)
  - `limit` - Items per page (default: 20)

#### 2. Courses API (`/api/courses`)
- **Method**: GET
- **Query Parameters**: Same as materials, plus:
  - `search` - Legacy search support
  - `maxPrice` - Price filtering

#### 3. Products API (`/api/products`)
- **Method**: GET
- **Query Parameters**: Same as courses

### Filtering Logic

#### Explore Mode
When multiple filters are applied, they work as AND conditions:
```javascript
// Example: category=grammar AND level=beginner AND country=spain
GET /api/materials?category=grammar&level=beginner&country=spain
```

#### Keyword Mode
Searches across multiple fields using OR conditions:
```javascript
// Example: searches in title, description, tags, category
GET /api/materials?keyword=spanish
```

### Database Mapping

#### Materials Model
- `category` → Room/Category filter
- `tags` → Sub Category, Theme, Level, Country filters
- `title`, `description` → Keyword search

#### Courses Model
- `category` → Room/Category filter
- `availableLevels` → Sub Category, Theme, Level, Country filters
- `title`, `description` → Keyword search

#### Products Model
- `category` → Room/Category filter
- `availableLevels` → Sub Category, Theme, Level, Country filters
- `name`, `description` → Keyword search

## Frontend Implementation

### Components Modified

#### 1. Searchbar Component (`src/components/Searchbar/Searchbar.jsx`)
- **Explore Mode**: Collects all dropdown selections and passes as filter object
- **Keyword Mode**: Passes keyword as search parameter
- **Search Handler**: Builds query parameters and calls API

#### 2. MaterialPage Component (`src/pages/MaterialPage.jsx`)
- **State Management**: Added `searchResults`, `searchLoading` states
- **Search Handler**: Makes API calls with filters, handles loading states
- **Results Display**: Shows filtered results with loading indicators

### State Management

```javascript
// Filter state structure
const filters = {
  category: "grammar",        // Room/Category
  subCategory: "verbs",       // Sub Category
  theme: "conversation",      // Theme/Genre
  level: "beginner",          // Level
  country: "spain",           // Country
  keyword: "spanish verbs"    // Keyword search
};
```

### API Integration

```javascript
// Building query parameters
const queryParams = new URLSearchParams();
Object.entries(filters).forEach(([key, value]) => {
  if (value && value.trim()) {
    queryParams.append(key, value.trim());
  }
});

// Making API call
const response = await apiGet(`/api/materials?${queryParams.toString()}`);
```

## Usage Examples

### Explore Mode
1. User selects "Grammar" from Room/Category dropdown
2. User selects "Beginner" from Level dropdown
3. User clicks Search button
4. API call: `GET /api/materials?category=Grammar&level=Beginner`
5. Results filtered by both conditions

### Keyword Mode
1. User types "spanish verbs" in keyword input
2. User clicks Search button
3. API call: `GET /api/materials?keyword=spanish%20verbs`
4. Results searched across title, description, tags, category

## Error Handling

### Backend
- Invalid query parameters are ignored
- Empty filters are filtered out
- Database errors return 500 status with error message

### Frontend
- Loading states during API calls
- Error messages for failed searches
- Fallback to "No results found" when no matches

## Testing

### Manual Testing
1. Start backend server: `cd Backend && npm run dev`
2. Start frontend: `npm run dev`
3. Navigate to `/material` page
4. Test both Explore and Keyword modes
5. Verify results update dynamically

### Automated Testing
Run the test script:
```bash
node test-filtering.js
```

## Performance Considerations

### Backend
- MongoDB indexes recommended on frequently filtered fields
- Pagination implemented to limit result sets
- Regex queries are case-insensitive for better user experience

### Frontend
- Loading states prevent multiple simultaneous requests
- Results cached in component state
- Debouncing could be added for real-time search

## Future Enhancements

1. **Real-time Search**: Add debouncing for instant results
2. **Advanced Filters**: Date ranges, price ranges, ratings
3. **Search Suggestions**: Autocomplete for keywords
4. **Saved Searches**: Allow users to save filter combinations
5. **Search Analytics**: Track popular searches and filters

## Troubleshooting

### Common Issues

1. **No Results**: Check if data exists with matching criteria
2. **Slow Performance**: Add database indexes on filtered fields
3. **CORS Errors**: Ensure backend CORS is configured for frontend domain
4. **API Errors**: Check backend logs for detailed error messages

### Debug Mode
Enable console logging in frontend components to see:
- Filter objects being sent
- API responses received
- Error messages and stack traces
