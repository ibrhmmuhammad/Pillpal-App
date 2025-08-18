import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Clock, Pill, CheckCircle, StickyNote } from 'lucide-react';

interface TakenMedication {
  id: string;
  medication_schedule_id: string;
  taken_at: string;
  notes: string | null;
  medication_schedules: {
    medication_name: string;
    dosage: number;
    time: string;
    iteration: string;
  };
}

interface MedicationTakenProps {
  refresh: boolean;
}

export const MedicationTaken = ({ refresh }: MedicationTakenProps) => {
  const [takenMedications, setTakenMedications] = useState<TakenMedication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTakenMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('medication_taken')
        .select(`
          *,
          medication_schedules (
            medication_name,
            dosage,
            time,
            iteration
          )
        `)
        .order('taken_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch taken medications');
      } else {
        setTakenMedications(data || []);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTakenMedications();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this taken medication record?')) return;

    try {
      const { error } = await supabase
        .from('medication_taken')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Failed to delete taken medication record');
      } else {
        toast.success('Taken medication record removed');
        fetchTakenMedications();
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
    return <div className="text-center p-4">Loading taken medications...</div>;
  }

  if (takenMedications.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No medications taken yet</h3>
          <p className="text-muted-foreground">Mark medications as taken from the Schedule tab!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Taken Medications</h2>
      <div className="grid gap-4">
        {takenMedications.map((taken) => (
          <Card key={taken.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{taken.medication_schedules.medication_name}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(taken.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateTime(taken.taken_at)}</span>
                </div>
                <Badge variant="secondary">
                  {getIterationLabel(taken.medication_schedules.iteration)}
                </Badge>
                <div className="flex items-center gap-1">
                  <Pill className="h-4 w-4 text-muted-foreground" />
                  <span>{taken.medication_schedules.dosage}mg</span>
                </div>
              </div>
              {taken.notes && (
                <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">{taken.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};