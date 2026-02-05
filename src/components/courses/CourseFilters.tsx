'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface CourseFiltersProps {
  categories: Category[]
}

export const CourseFilters: React.FC<CourseFiltersProps> = ({ categories }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedLevel, setSelectedLevel] = useState(searchParams.get('level') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest')

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    router.push(`/courses?${params.toString()}`)
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedLevel('')
    setSortBy('newest')
    router.push('/courses')
  }

  const hasActiveFilters = selectedCategory || selectedLevel || sortBy !== 'newest'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit sticky top-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-bold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Category
        </label>
        <div className="space-y-2">
          <button
            onClick={() => {
              setSelectedCategory('')
              updateFilters('category', '')
            }}
            className={`w-full text-left px-3 py-2 rounded-lg transition ${
              !selectedCategory
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.slug)
                updateFilters('category', category.slug)
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition ${
                selectedCategory === category.slug
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Level Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Level
        </label>
        <div className="space-y-2">
          {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
            <button
              key={level}
              onClick={() => {
                const newLevel = selectedLevel === level ? '' : level
                setSelectedLevel(newLevel)
                updateFilters('level', newLevel)
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition ${
                selectedLevel === level
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value)
            updateFilters('sortBy', e.target.value)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="newest">Newest First</option>
          <option value="popular">Most Popular</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>
    </div>
  )
}