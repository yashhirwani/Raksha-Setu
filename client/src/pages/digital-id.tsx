import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, User, CheckCircle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { Card, CardContent } from "@/components/ui/card";

interface DigitalIdProps {
  touristId: string;
  onComplete: () => void;
}

export default function DigitalId({ touristId, onComplete }: DigitalIdProps) {
  const [, navigate] = useLocation();

  const { data: tourist, isLoading } = useQuery<any>({
    queryKey: ["/api/tourists", touristId],
    enabled: !!touristId,
  });
  const { t } = useI18n();

  const handleContinue = () => {
    onComplete();
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('loading_digital_id')}</p>
        </div>
      </div>
    );
  }

  if (!tourist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('tourist_not_found')}</p>
      </div>
    );
  }

  const initials = tourist.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary via-secondary to-accent p-6 text-primary-foreground">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-primary-foreground"
            data-testid="button-back"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-semibold">{t('digital_travel_id')}</h1>
          <div></div>
        </div>
        
        <Card className="bg-card/95 backdrop-blur-sm text-card-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-semibold" data-testid="tourist-name">{tourist.name}</h3>
                  <p className="text-sm text-muted-foreground">{t('tourist_id_verified')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs">
                <CheckCircle size={12} />
                <span>{t('verified')}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">ID Number</p>
                <p className="font-medium text-sm" data-testid="tourist-id-number">{tourist.idNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nationality</p>
                <p className="font-medium text-sm" data-testid="tourist-nationality">{tourist.nationality}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Issue Date</p>
                <p className="font-medium text-sm">{new Date(tourist.issuedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expires</p>
                <p className="font-medium text-sm">{new Date(tourist.expiresAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-center">
                <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCode size={48} className="text-muted-foreground mb-2 mx-auto" />
                    <p className="text-xs text-muted-foreground">{t('blockchain_id')}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2" data-testid="blockchain-hash">
                Hash: {tourist.blockchainHash}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="p-6">
        <Button
          onClick={handleContinue}
          className="w-full bg-primary text-primary-foreground"
          data-testid="button-continue"
        >
          {t('continue_to_dashboard')}
        </Button>
      </div>
    </div>
  );
}
