import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Pencil, Trash2, Clock, Pill } from 'lucide-react';

interface Medication {
  id: string;
  medication_name: string;
  time: string;
  iteration: string;
  dosage: number;
  created_at: string;
}

interface MedicationListProps {
  onEdit: (medication: Medication) => void;
  refresh: boolean;
}

export const MedicationList = ({ onEdit, refresh }: MedicationListProps) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('medication_schedules')
        .select('*')
        .order('time', { ascending: true });

      if (error) {
        toast.error('Failed to fetch medications');
      } else {
        setMedications(data || []);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medication?')) return;

    try {
      const { error } = await supabase
        .from('medication_schedules')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Failed to delete medication');
      } else {
        toast.success('Medication deleted successfully');
        fetchMedications();
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getIterationLabel = (iteration: string) => {
    switch (iteration) {
      case 'once': return 'Once daily';
      case 'twice': return 'Twice daily';
      case 'thrice': return 'Three times daily';
      default: return iteration;
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading medications...</div>;
  }

  if (medications.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <Pill className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No medications yet</h3>
          <p className="text-muted-foreground">Add your first medication to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Medications</h2>
      <div className="grid gap-4">
        {medications.map((medication) => (
          <Card key={medication.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{medication.medication_name}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(medication)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(medication.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatTime(medication.time)}</span>
                </div>
                <Badge variant="secondary">
                  {getIterationLabel(medication.iteration)}
                </Badge>
                <div className="flex items-center gap-1">
                  <Pill className="h-4 w-4 text-muted-foreground" />
                  <span>{medication.dosage}mg</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};