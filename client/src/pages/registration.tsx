import { useState } from "react";
import { useLocation } from "wouter";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { generateBlockchainId } from "@/lib/blockchain-utils";

interface TouristForm {
  name: string;
  idNumber: string;
  nationality: string;
  emergencyContact: string;
}

export default function Registration() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<TouristForm>({
    name: "",
    idNumber: "",
    nationality: "",
    emergencyContact: "",
  });

  const createTouristMutation = useMutation({
    mutationFn: async (data: TouristForm) => {
      const response = await apiRequest("POST", "/api/tourists", data);
      return response.json();
    },
    onSuccess: (tourist) => {
      toast({
        title: "Success",
        description: "Digital ID generated successfully!",
      });
      navigate(`/digital-id/${tourist.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate digital ID",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.idNumber || !formData.nationality || !formData.emergencyContact) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createTouristMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof TouristForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-secondary text-primary-foreground pb-8">
      <div className="text-center pt-16 px-6 pb-12">
        <div className="w-16 h-16 bg-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="text-2xl text-primary" size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-2" data-testid="app-title">SafeTravel</h1>
        <p className="text-primary-foreground/80 text-sm">Your trusted companion for safe travel</p>
      </div>
      
      <div className="px-6 py-6 -mt-8 bg-card rounded-t-3xl relative z-10 min-h-screen">
        <h2 className="text-xl font-semibold text-card-foreground mb-6" data-testid="form-title">
          Create Your Digital Travel ID
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-card-foreground mb-2">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              data-testid="input-name"
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="idNumber" className="block text-sm font-medium text-card-foreground mb-2">
              Passport/ID Number
            </Label>
            <Input
              id="idNumber"
              type="text"
              placeholder="Enter ID number"
              value={formData.idNumber}
              onChange={(e) => handleInputChange("idNumber", e.target.value)}
              data-testid="input-id-number"
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="nationality" className="block text-sm font-medium text-card-foreground mb-2">
              Nationality
            </Label>
            <Select value={formData.nationality} onValueChange={(value) => handleInputChange("nationality", value)}>
              <SelectTrigger data-testid="select-nationality">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Japan">Japan</SelectItem>
                <SelectItem value="India">India</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="emergencyContact" className="block text-sm font-medium text-card-foreground mb-2">
              Emergency Contact
            </Label>
            <Input
              id="emergencyContact"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.emergencyContact}
              onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
              data-testid="input-emergency-contact"
              className="w-full"
            />
          </div>
          
          <Card className="bg-muted border-0">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Shield className="text-primary mt-1" size={16} />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Your digital ID will be secured using blockchain technology and comply with international privacy standards.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Button
            type="submit"
            disabled={createTouristMutation.isPending}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-generate-id"
          >
            {createTouristMutation.isPending ? "Generating..." : "Generate Digital ID"}
          </Button>
        </form>
      </div>
    </div>
  );
}
