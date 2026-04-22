"use client";

import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    console.log('Current user:', user);

    // Get all items
    const { data: itemsData, error: itemsError } = await supabase
      .from('lost_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (itemsError) {
      console.error('Items error:', itemsError);
    } else {
      console.log('All items:', itemsData);
      setItems(itemsData || []);
    }

    // Get all claims
    const { data: claimsData, error: claimsError } = await supabase
      .from('claim_requests')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (claimsError) {
      console.error('Claims error:', claimsError);
    } else {
      console.log('All claims:', claimsData);
      setClaims(claimsData || []);
    }

    setLoading(false);
  };

  const deleteItem = async (itemId: string, itemTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${itemTitle}"? This will also delete all claims associated with it.`)) {
      return;
    }

    setDeleting(itemId);
    try {
      const { error } = await supabase
        .from('lost_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Delete error:', error);
        alert('Failed to delete item: ' + error.message);
      } else {
        alert('Item deleted successfully!');
        await loadData(); // Reload data
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete item');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="text-center">Loading debug data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-6">Debug Page</h1>

        <Button onClick={loadData} className="mb-6">
          Refresh Data
        </Button>

        {/* Current User */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current User</CardTitle>
          </CardHeader>
          <CardContent>
            {currentUser ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {currentUser.id}</p>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <details>
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Full user object (click to expand)
                  </summary>
                  <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto">
                    {JSON.stringify(currentUser, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-muted-foreground">Not logged in</p>
            )}
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>All Items ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="p-4 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p><strong>Title:</strong> {item.title}</p>
                      <p><strong>ID:</strong> <code className="text-xs">{item.id}</code></p>
                      <p><strong>Created By:</strong> {item.created_by ? (
                        <code className="text-xs">{item.created_by}</code>
                      ) : (
                        <span className="text-red-500">NULL</span>
                      )}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.created_by === currentUser?.id && (
                          <span className="text-green-600 font-semibold">← Created by you</span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteItem(item.id, item.title)}
                      disabled={deleting === item.id}
                    >
                      {deleting === item.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      Full item object
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-muted-foreground">No items found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Claims */}
        <Card>
          <CardHeader>
            <CardTitle>All Claims ({claims.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {claims.map((claim) => (
                <div key={claim.id} className="p-4 border rounded">
                  <p><strong>Claimant:</strong> {claim.claimant_name} ({claim.claimant_email})</p>
                  <p><strong>Item ID:</strong> <code className="text-xs">{claim.item_id}</code></p>
                  <p><strong>Status:</strong> {claim.status}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    For item: {items.find(i => i.id === claim.item_id)?.title || 'Unknown'}
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      Full claim object
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(claim, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
              {claims.length === 0 && (
                <p className="text-muted-foreground">No claims found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
