import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllCategories } from '@/db/api';
import type { Category } from '@/types';
import { Package2 } from 'lucide-react';

export default function AllCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 pb-24 md:pb-8 bg-background">
        <div className="container">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">All Categories</h1>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square bg-muted rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8 bg-background">
      <div className="container">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">All Categories</h1>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No categories available</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                to={`/search?category=${category.id}`}
                className="group"
              >
                <div className="flex flex-col items-center">
                  <div className="w-full aspect-square bg-muted rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package2 className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm md:text-base font-medium text-center mt-2 text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
