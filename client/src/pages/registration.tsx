import { useState, useEffect } from "react";
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
import { useI18n } from '@/i18n';
import { saveCredential } from '@/lib/auth';

interface TouristForm {
  name: string;
  passportNumber?: string;
  aadhaarNumber?: string;
  nationality: string;
  emergencyContact: string;
}

export default function Registration() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<TouristForm>({
    name: "",
    passportNumber: undefined,
    aadhaarNumber: undefined,
    nationality: "",
    emergencyContact: "",
  });

  const [consentGps, setConsentGps] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { t, lang, setLang } = useI18n();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // basic dial code mapping for common countries
  const countryDialCodes: Record<string, string> = {
    India: "+91",
    "United States": "+1",
    "United Kingdom": "+44",
    Canada: "+1",
    Australia: "+61",
    Germany: "+49",
    France: "+33",
    Japan: "+81",
  };

  // When nationality changes, prefill emergency contact with country code
  useEffect(() => {
    const code = countryDialCodes[formData.nationality];
    if (!code) return;

    setFormData(prev => {
      const current = prev.emergencyContact || '';

      // If already starts with the desired code (with or without a space), leave it
      if (current.startsWith(code) || current.startsWith(code + ' ') || current.startsWith(code.replace('+', ''))) {
        return prev;
      }

      // Remove any leading +<digits> (existing dial code) and any whitespace to preserve local number
      const rest = current.replace(/^\+?\d+\s*/, '');

      const newVal = rest ? `${code} ${rest}` : `${code} `;
      return { ...prev, emergencyContact: newVal };
    });
  }, [formData.nationality]);

  const onLogoChange = (file?: File) => {
    if (!file) return;
    // preview
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(String(reader.result ?? ''));
    reader.readAsDataURL(file);

    // resize image to max 800x800 to reduce upload size
    const img = new Image();
    img.onload = async () => {
      const maxDim = 800;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const cw = Math.round(img.width * scale);
      const ch = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (!ctx) return setLogoFile(file);
      ctx.drawImage(img, 0, 0, cw, ch);
      canvas.toBlob((blob) => {
        if (blob) {
          const f = new File([blob], file.name, { type: blob.type });
          setLogoFile(f);
        } else {
          setLogoFile(file);
        }
      }, 'image/png', 0.9);
    };
    img.src = URL.createObjectURL(file);
  };

  const createTouristMutation = useMutation({
    mutationFn: async (data: TouristForm) => {
      const idNumber = data.passportNumber || data.aadhaarNumber || '';
      if (logoFile) {
        const fd = new FormData();
        fd.append('logo', logoFile);
        fd.append('name', data.name);
        fd.append('passportNumber', data.passportNumber ?? '');
        fd.append('aadhaarNumber', data.aadhaarNumber ?? '');
        fd.append('nationality', data.nationality);
        fd.append('emergencyContact', data.emergencyContact);
        const res = await fetch('/api/tourists-with-logo', { method: 'POST', body: fd });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      }

      const payload = { ...data, idNumber, consentGps } as any;
      const response = await apiRequest("POST", "/api/tourists", payload);
      return response.json();
    },
    onSuccess: (tourist) => {
      toast({
        title: t('success'),
        description: t('account_created_go_login'),
      });
      // save credentials locally
      if (password && (formData.aadhaarNumber || formData.passportNumber)) {
        const idNum = formData.aadhaarNumber || formData.passportNumber || '';
        saveCredential(idNum, password).catch(() => {});
      }
      // notify header to refresh immediately
      try { window.dispatchEvent(new CustomEvent('tourist:changed', { detail: tourist })); } catch (e) {}
      navigate('/login');
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
    if (!formData.name || !formData.nationality || !formData.emergencyContact) {
      toast({
        title: t('error'),
        description: t('please_fill_required'),
        variant: "destructive",
      });
      return;
    }

    // name length
    if (formData.name.trim().length < 3) {
      toast({ title: t('error'), description: t('enter_full_name'), variant: 'destructive' });
      return;
    }

    // Aadhaar/passport validation
    const aadhaarRegex = /^\d{12}$/;
    const passportRegex = /^[A-Za-z]{1}\d{7}$/;
    if (formData.nationality === 'India') {
      if (!formData.aadhaarNumber || !aadhaarRegex.test(formData.aadhaarNumber)) {
        toast({ title: t('error'), description: t('aadhaar_invalid'), variant: 'destructive' });
        return;
      }
    } else {
      if (!formData.passportNumber || !passportRegex.test(formData.passportNumber)) {
        toast({ title: t('error'), description: t('passport_invalid'), variant: 'destructive' });
        return;
      }
    }

    // Emergency contact validation (allow spaces, dashes, parentheses, leading +)
    const rawPhone = formData.emergencyContact.trim();
    const digitCount = rawPhone.replace(/[^0-9]/g, '').length;
    const formattingOk = /^[+]?[-() 0-9]+$/.test(rawPhone);
    if (!formattingOk || digitCount < 7 || digitCount > 15) {
      toast({ title: t('error'), description: t('emergency_phone_invalid'), variant: 'destructive' });
      return;
    }

    // password checks
    if (password.length < 8) {
      toast({ title: t('error'), description: t('password_strength'), variant: 'destructive' });
      return;
    }
    if (!/[0-9]/.test(password) || !/[!@#\$%\^&\*(),.?":{}|<>]/.test(password)) {
      toast({ title: t('error'), description: t('password_strength'), variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: t('error'), description: t('password_mismatch'), variant: 'destructive' });
      return;
    }

    // require ID depending on nationality
    if (formData.nationality === 'India') {
      if (!formData.aadhaarNumber) {
        toast({ title: t('error'), description: t('aadhaar_required'), variant: 'destructive' });
        return;
      }
    } else {
      if (!formData.passportNumber) {
        toast({ title: t('error'), description: t('passport_required'), variant: 'destructive' });
        return;
      }
    }

    // require GPS consent
    if (!consentGps) {
      toast({ title: t('consent_required'), description: t('consent_gps_required'), variant: 'destructive' });
      return;
    }

    createTouristMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof TouristForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-secondary text-black pb-8">
      <div className="text-center pt-12 px-6 pb-8">
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/raksha-logo.png" alt="RakshaSetu" className="object-contain w-full h-full" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold mb-0 text-black" data-testid="app-title">{t('app_title')}</h1>
            <p className="text-black/80 text-sm">{t('app_subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 -mt-8 bg-card rounded-t-3xl relative z-10 min-h-screen">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black" data-testid="form-title">{t('form_title')}</h2>
          <div>
            <select value={lang} onChange={(e) => setLang(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-black mb-2">
              {t('full_name')}
            </Label>
              <Input
                id="name"
                type="text"
                placeholder={t('enter_full_name')}
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                data-testid="input-name"
                className="w-full text-black"
              />
          </div>
          <div>
            <Label htmlFor="nationality" className="block text-sm font-medium text-black mb-2">
              Nationality
            </Label>
            <Select value={formData.nationality} onValueChange={(value) => handleInputChange("nationality", value)}>
              <SelectTrigger data-testid="select-nationality">
                <SelectValue placeholder={t('select_country')} />
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

          <div className="grid grid-cols-1 gap-4">
            {formData.nationality === 'India' ? (
              <div>
                <Label htmlFor="aadhaar" className="block text-sm font-medium text-black mb-2">{t('aadhaar')}</Label>
                <Input id="aadhaar" type="text" placeholder={t('aadhaar_placeholder')} value={formData.aadhaarNumber ?? ''} onChange={(e) => handleInputChange('aadhaarNumber' as any, e.target.value)} className="w-full text-black" />
              </div>
            ) : (
              <div>
                <Label htmlFor="passport" className="block text-sm font-medium text-black mb-2">{t('passport')}</Label>
                <Input id="passport" type="text" placeholder={t('passport_placeholder')} value={formData.passportNumber ?? ''} onChange={(e) => handleInputChange('passportNumber' as any, e.target.value)} className="w-full text-black" />
              </div>
            )}
          </div>
          <div className="text-xs text-black">{formData.nationality === 'India' ? t('aadhaar_required') : t('passport_required')}</div>
          
          <div>
            <Label htmlFor="emergencyContact" className="block text-sm font-medium text-black mb-2">{t('emergency_contact')}</Label>
          <Input id="emergencyContact" type="tel" placeholder={t('emergency_placeholder')} value={formData.emergencyContact} onChange={(e) => handleInputChange("emergencyContact", e.target.value)} data-testid="input-emergency-contact" className="w-full text-black" />
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-black mb-2">{t('password_label')}</Label>
            <Input id="password" type="password" placeholder={t('password_placeholder') || 'At least 8 characters, include number & symbol'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-black" />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">{t('confirm_password_label')}</Label>
            <Input id="confirmPassword" type="password" placeholder={t('confirm_password_placeholder') || 'Repeat your password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full text-black" />
          </div>

          <Card className="bg-muted border-0">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-4 h-4">
                  <img src="/raksha-logo.png" alt="logo" className="object-contain w-full h-full" />
                </div>
                <div>
                    <p className="text-sm text-black">
                      {t('id_security_blurb')}
                    </p>
                  </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center space-x-2 mt-2">
            <input id="gps-consent" type="checkbox" checked={consentGps} onChange={(e) => setConsentGps(e.target.checked)} />
              <label htmlFor="gps-consent" className="text-sm text-black">{t('gps_consent_text')}</label>
          </div>
          
          <Button type="submit" disabled={createTouristMutation.isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-generate-id">
          {createTouristMutation.isPending ? t('generating') : t('register')}
          </Button>
          <div className="text-center mt-2">
            <button type="button" className="text-sm underline text-black" onClick={() => navigate('/login')}>
              {t('have_account_login')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
