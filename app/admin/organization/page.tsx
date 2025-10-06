"use client";

import { useState, useEffect } from "react";
import { useRole } from "@/app/lib/useRole";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { Trash2, PlusCircle } from "lucide-react";

type Organization = {
  id: number;
  code: string;
  name: string;
  country: string;
  logo: string | null;
  baseUrl: string;
  fromEmail: string;
  emails: {
    all_races: Array<{ email: string; name: string; reason: string }>;
    women: Array<{ email: string; name: string; reason: string }>;
    men: Array<{ email: string; name: string; reason: string }>;
  };
  contacts: {
    responsible_for_entry: {
      address: string;
      men: { name: string; phone: string; email: string };
      women: { name: string; phone: string; email: string };
    };
    signature: { name: string; title: string };
  };
  emailTemplates: {
    inscription_pdf?: {
      subject_prefix: string;
      contact_email: { men: string; women: string };
      signature_urls: { men: string; women: string };
    };
    new_inscription?: { recipients: string[] };
    daily_recap?: { recipients: string[]; cc: string[] };
    contact_inscription?: { recipients: string[] };
    event_data_updated?: { recipients: string[] };
  };
};

export default function OrganizationAdminPage() {
  const role = useRole();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("admin.organizationConfig");
  const tCommon = useTranslations("common.actions");

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role !== "super-admin") {
      router.push("/");
      return;
    }

    // Fetch all organizations
    fetch("/api/admin/organizations")
      .then((res) => res.json())
      .then((data) => {
        setOrganizations(data);
        if (data.length > 0) {
          setSelectedCode(data[0].code);
        }
      })
      .catch((error) => {
        console.error("Error fetching organizations:", error);
        toast({
          title: "Error",
          description: "Failed to load organizations",
          variant: "destructive",
        });
      });
  }, [role, router, toast]);

  useEffect(() => {
    if (!selectedCode) return;

    setLoading(true);
    fetch(`/api/admin/organizations/${selectedCode}`)
      .then((res) => res.json())
      .then((data) => {
        setOrganization(data);
      })
      .catch((error) => {
        console.error("Error fetching organization:", error);
        toast({
          title: "Error",
          description: "Failed to load organization",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [selectedCode, toast]);

  const handleSave = async () => {
    if (!organization) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${selectedCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(organization),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
    } catch (error) {
      console.error("Error saving organization:", error);
      toast({
        title: "Error",
        description: "Failed to save organization",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (role !== "super-admin") {
    return null;
  }

  if (!organization || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t("loading")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-gray-600 mt-1">{t("subtitle")}</p>
          </div>
          <Select value={selectedCode} onValueChange={setSelectedCode}>
            <SelectTrigger className="w-[150px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.code} value={org.code}>
                  {org.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      <div className="space-y-6">
        {/* General Information */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900">General Information</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Usage:</strong> Basic organization details used throughout the application (PDF headers, email signatures, URLs).
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-700 font-medium">Code</Label>
              <p className="text-xs text-gray-500 mt-0.5">Unique identifier (e.g., FFS, RFEDI) - cannot be changed</p>
              <Input
                value={organization.code}
                disabled
                className="mt-1.5 bg-gray-50 border-gray-300"
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Country (ISO 3-letter)</Label>
              <p className="text-xs text-gray-500 mt-0.5">Used for filtering and display (e.g., FRA, ESP, AND)</p>
              <Input
                value={organization.country}
                onChange={(e) =>
                  setOrganization({ ...organization, country: e.target.value })
                }
                className="mt-1.5 bg-white border-gray-300"
                placeholder="FRA"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-gray-700 font-medium">Organization Name</Label>
              <p className="text-xs text-gray-500 mt-0.5">Full name displayed in PDFs and emails (language-specific, set in database per language)</p>
              <Input
                value={organization.name}
                onChange={(e) =>
                  setOrganization({ ...organization, name: e.target.value })
                }
                className="mt-1.5 bg-white border-gray-300"
                placeholder="Fédération Française de Ski"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-gray-700 font-medium">Logo URL</Label>
              <p className="text-xs text-gray-500 mt-0.5">Used in PDF headers and email templates (publicly accessible URL)</p>
              <Input
                value={organization.logo || ""}
                onChange={(e) =>
                  setOrganization({ ...organization, logo: e.target.value })
                }
                className="mt-1.5 bg-white border-gray-300"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Base URL (Application)</Label>
              <p className="text-xs text-gray-500 mt-0.5">Used in all email links to redirect users to inscriptions (e.g., daily recap, contact emails)</p>
              <Input
                value={organization.baseUrl}
                onChange={(e) =>
                  setOrganization({ ...organization, baseUrl: e.target.value })
                }
                className="mt-1.5 bg-white border-gray-300"
                placeholder="https://inscriptions-fis-etranger.fr"
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">From Email (Sender)</Label>
              <p className="text-xs text-gray-500 mt-0.5">Displayed as sender in all automated emails (format: &quot;Name &lt;email@domain.com&gt;&quot;)</p>
              <Input
                value={organization.fromEmail}
                onChange={(e) =>
                  setOrganization({ ...organization, fromEmail: e.target.value })
                }
                className="mt-1.5 bg-white border-gray-300"
                placeholder="Inscriptions FIS &lt;noreply@ffs.fr&gt;"
              />
            </div>
          </div>
        </section>

        {/* Email Recipients */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900">Email Recipients (PDF)</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              📨 <strong>Usage:</strong> Recipients who will receive inscription PDFs when sent from the app.
            </p>
            <p className="text-xs text-green-700 mt-2">
              • <strong>All Races:</strong> Always included (e.g., federation admins)<br />
              • <strong>Men/Women:</strong> Only included when sending gender-specific PDFs
            </p>
          </div>
          {/* All Races Recipients */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <Label className="text-gray-700 font-medium">All Races Recipients</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setOrganization({
                    ...organization,
                    emails: {
                      ...organization.emails,
                      all_races: [...organization.emails.all_races, { email: "", name: "", reason: "" }],
                    },
                  });
                }}
                className="cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Add Recipient
              </Button>
            </div>
            <p className="text-xs text-gray-500">Always BCC&apos;d on all PDF emails</p>
            {organization.emails.all_races.map((recipient, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-lg">
                <div className="col-span-4">
                  <Label className="text-xs text-gray-600">Email</Label>
                  <Input
                    value={recipient.email}
                    onChange={(e) => {
                      const updated = [...organization.emails.all_races];
                      updated[index].email = e.target.value;
                      setOrganization({
                        ...organization,
                        emails: { ...organization.emails, all_races: updated },
                      });
                    }}
                    className="bg-white border-gray-300 mt-1"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs text-gray-600">Name</Label>
                  <Input
                    value={recipient.name}
                    onChange={(e) => {
                      const updated = [...organization.emails.all_races];
                      updated[index].name = e.target.value;
                      setOrganization({
                        ...organization,
                        emails: { ...organization.emails, all_races: updated },
                      });
                    }}
                    className="bg-white border-gray-300 mt-1"
                    placeholder="J. Doe"
                  />
                </div>
                <div className="col-span-4">
                  <Label className="text-xs text-gray-600">Reason</Label>
                  <Input
                    value={recipient.reason}
                    onChange={(e) => {
                      const updated = [...organization.emails.all_races];
                      updated[index].reason = e.target.value;
                      setOrganization({
                        ...organization,
                        emails: { ...organization.emails, all_races: updated },
                      });
                    }}
                    className="bg-white border-gray-300 mt-1"
                    placeholder="Federation Admin"
                  />
                </div>
                <div className="col-span-1 flex items-end justify-end h-full pb-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = organization.emails.all_races.filter((_, i) => i !== index);
                      setOrganization({
                        ...organization,
                        emails: { ...organization.emails, all_races: updated },
                      });
                    }}
                    className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Men Recipients */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 font-medium">Men Recipients</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOrganization({
                      ...organization,
                      emails: {
                        ...organization.emails,
                        men: [...organization.emails.men, { email: "", name: "", reason: "" }],
                      },
                    });
                  }}
                  className="cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-500">Only BCC&apos;d on men&apos;s team PDFs</p>
              {organization.emails.men.map((recipient, index) => (
                <div key={index} className="space-y-2 p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = organization.emails.men.filter((_, i) => i !== index);
                        setOrganization({
                          ...organization,
                          emails: { ...organization.emails, men: updated },
                        });
                      }}
                      className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 -mt-1 -mr-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Email</Label>
                    <Input
                      value={recipient.email}
                      onChange={(e) => {
                        const updated = [...organization.emails.men];
                        updated[index].email = e.target.value;
                        setOrganization({
                          ...organization,
                          emails: { ...organization.emails, men: updated },
                        });
                      }}
                      className="bg-white border-gray-300 mt-1"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Name</Label>
                    <Input
                      value={recipient.name}
                      onChange={(e) => {
                        const updated = [...organization.emails.men];
                        updated[index].name = e.target.value;
                        setOrganization({
                          ...organization,
                          emails: { ...organization.emails, men: updated },
                        });
                      }}
                      className="bg-white border-gray-300 mt-1"
                      placeholder="J. Doe"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Reason</Label>
                    <Input
                      value={recipient.reason}
                      onChange={(e) => {
                        const updated = [...organization.emails.men];
                        updated[index].reason = e.target.value;
                        setOrganization({
                          ...organization,
                          emails: { ...organization.emails, men: updated },
                        });
                      }}
                      className="bg-white border-gray-300 mt-1"
                      placeholder="Men's Team Coordinator"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Women Recipients */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 font-medium">Women Recipients</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOrganization({
                      ...organization,
                      emails: {
                        ...organization.emails,
                        women: [...organization.emails.women, { email: "", name: "", reason: "" }],
                      },
                    });
                  }}
                  className="cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-500">Only BCC&apos;d on women&apos;s team PDFs</p>
              {organization.emails.women.map((recipient, index) => (
                <div key={index} className="space-y-2 p-3 bg-pink-50 rounded-lg">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = organization.emails.women.filter((_, i) => i !== index);
                        setOrganization({
                          ...organization,
                          emails: { ...organization.emails, women: updated },
                        });
                      }}
                      className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 -mt-1 -mr-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Email</Label>
                    <Input
                      value={recipient.email}
                      onChange={(e) => {
                        const updated = [...organization.emails.women];
                        updated[index].email = e.target.value;
                        setOrganization({
                          ...organization,
                          emails: { ...organization.emails, women: updated },
                        });
                      }}
                      className="bg-white border-gray-300 mt-1"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Name</Label>
                    <Input
                      value={recipient.name}
                      onChange={(e) => {
                        const updated = [...organization.emails.women];
                        updated[index].name = e.target.value;
                        setOrganization({
                          ...organization,
                          emails: { ...organization.emails, women: updated },
                        });
                      }}
                      className="bg-white border-gray-300 mt-1"
                      placeholder="J. Doe"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Reason</Label>
                    <Input
                      value={recipient.reason}
                      onChange={(e) => {
                        const updated = [...organization.emails.women];
                        updated[index].reason = e.target.value;
                        setOrganization({
                          ...organization,
                          emails: { ...organization.emails, women: updated },
                        });
                      }}
                      className="bg-white border-gray-300 mt-1"
                      placeholder="Women's Team Coordinator"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contacts */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900">Contacts (PDF)</h2>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-800">
              📄 <strong>Usage:</strong> Displayed in the &quot;Responsible for Entry&quot; section at the bottom of generated PDFs.
            </p>
          </div>
          <div className="space-y-6">
            <div>
              <Label className="text-gray-700 font-medium">Federation Address</Label>
              <p className="text-xs text-gray-500 mt-0.5">Full postal address of the federation (shown in PDF footer)</p>
              <Input
                value={organization.contacts.responsible_for_entry.address}
                onChange={(e) =>
                  setOrganization({
                    ...organization,
                    contacts: {
                      ...organization.contacts,
                      responsible_for_entry: {
                        ...organization.contacts.responsible_for_entry,
                        address: e.target.value,
                      },
                    },
                  })
                }
                className="mt-1.5 bg-white border-gray-300"
                placeholder="FFS - 50 avenue des Marquisats - 74000 ANNECY"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold mb-1 text-blue-900">👨 Men Contact</h3>
                <p className="text-xs text-blue-700 mb-3">Team coordinator for men&apos;s races (shown in men&apos;s PDFs only)</p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-600">Name</Label>
                    <Input
                      placeholder="Philippe MARTIN"
                      value={organization.contacts.responsible_for_entry.men.name}
                      onChange={(e) =>
                        setOrganization({
                          ...organization,
                          contacts: {
                            ...organization.contacts,
                            responsible_for_entry: {
                              ...organization.contacts.responsible_for_entry,
                              men: {
                                ...organization.contacts.responsible_for_entry.men,
                                name: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="bg-white border-gray-300 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Phone</Label>
                    <Input
                      placeholder="+33 6 12 34 56 78"
                      value={organization.contacts.responsible_for_entry.men.phone}
                      onChange={(e) =>
                        setOrganization({
                          ...organization,
                          contacts: {
                            ...organization.contacts,
                            responsible_for_entry: {
                              ...organization.contacts.responsible_for_entry,
                              men: {
                                ...organization.contacts.responsible_for_entry.men,
                                phone: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="bg-white border-gray-300 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Email</Label>
                    <Input
                      placeholder="contact@federation.com"
                      value={organization.contacts.responsible_for_entry.men.email}
                      onChange={(e) =>
                        setOrganization({
                          ...organization,
                          contacts: {
                            ...organization.contacts,
                            responsible_for_entry: {
                              ...organization.contacts.responsible_for_entry,
                              men: {
                                ...organization.contacts.responsible_for_entry.men,
                                email: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="bg-white border-gray-300 mt-1"
                    />
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-pink-50">
                <h3 className="font-semibold mb-1 text-pink-900">👩 Women Contact</h3>
                <p className="text-xs text-pink-700 mb-3">Team coordinator for women&apos;s races (shown in women&apos;s PDFs only)</p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-600">Name</Label>
                    <Input
                      placeholder="Marie DUPONT"
                      value={organization.contacts.responsible_for_entry.women.name}
                      onChange={(e) =>
                        setOrganization({
                          ...organization,
                          contacts: {
                            ...organization.contacts,
                            responsible_for_entry: {
                              ...organization.contacts.responsible_for_entry,
                              women: {
                                ...organization.contacts.responsible_for_entry.women,
                                name: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="bg-white border-gray-300 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Phone</Label>
                    <Input
                      placeholder="+33 6 12 34 56 78"
                      value={organization.contacts.responsible_for_entry.women.phone}
                      onChange={(e) =>
                        setOrganization({
                          ...organization,
                          contacts: {
                            ...organization.contacts,
                            responsible_for_entry: {
                              ...organization.contacts.responsible_for_entry,
                              women: {
                                ...organization.contacts.responsible_for_entry.women,
                                phone: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="bg-white border-gray-300 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Email</Label>
                    <Input
                      placeholder="contact@federation.com"
                      value={organization.contacts.responsible_for_entry.women.email}
                      onChange={(e) =>
                        setOrganization({
                          ...organization,
                          contacts: {
                            ...organization.contacts,
                            responsible_for_entry: {
                              ...organization.contacts.responsible_for_entry,
                              women: {
                                ...organization.contacts.responsible_for_entry.women,
                                email: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="bg-white border-gray-300 mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-1 text-gray-900">✍️ Signature</h3>
              <p className="text-xs text-gray-500 mb-3">Official signature displayed at the bottom of all PDFs</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium">Name</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Full name of the signing authority</p>
                  <Input
                    placeholder="David CHASTAN"
                    value={organization.contacts.signature.name}
                    onChange={(e) =>
                      setOrganization({
                        ...organization,
                        contacts: {
                          ...organization.contacts,
                          signature: {
                            ...organization.contacts.signature,
                            name: e.target.value,
                          },
                        },
                      })
                    }
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Title</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Official job title or position</p>
                  <Input
                    placeholder="Directeur Sportif Coupe du Monde"
                    value={organization.contacts.signature.title}
                    onChange={(e) =>
                      setOrganization({
                        ...organization,
                        contacts: {
                          ...organization.contacts,
                          signature: {
                            ...organization.contacts.signature,
                            title: e.target.value,
                          },
                        },
                      })
                    }
                    className="mt-1.5 bg-white border-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Email Templates */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 border-b pb-3">📧 Email Templates</h2>
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                💡 <strong>Tip:</strong> Configure email templates for different types of notifications
              </p>
            </div>

            {/* Inscription PDF Template */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold mb-3 text-blue-900">📄 Inscription PDF Email</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600">Subject Prefix</Label>
                  <p className="text-xs text-gray-500 mb-1">Prefix for email subject (e.g., &quot;French 🇫🇷&quot;)</p>
                  <Input
                    value={organization.emailTemplates.inscription_pdf?.subject_prefix || ""}
                    onChange={(e) =>
                      setOrganization({
                        ...organization,
                        emailTemplates: {
                          ...organization.emailTemplates,
                          inscription_pdf: {
                            ...(organization.emailTemplates.inscription_pdf || {
                              subject_prefix: "",
                              contact_email: { men: "", women: "" },
                              signature_urls: { men: "", women: "" },
                            }),
                            subject_prefix: e.target.value,
                          },
                        },
                      })
                    }
                    className="bg-white border-gray-300 mt-1"
                    placeholder="French 🇫🇷"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">Contact Email (Men)</Label>
                    <Input
                      value={organization.emailTemplates.inscription_pdf?.contact_email?.men || ""}
                      onChange={(e) =>
                        setOrganization({
                          ...organization,
                          emailTemplates: {
                            ...organization.emailTemplates,
                            inscription_pdf: {
                              ...(organization.emailTemplates.inscription_pdf || {
                                subject_prefix: "",
                                contact_email: { men: "", women: "" },
                                signature_urls: { men: "", women: "" },
                              }),
                              contact_email: {
                                ...(organization.emailTemplates.inscription_pdf?.contact_email || { men: "", women: "" }),
                                men: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="bg-white border-gray-300 mt-1"
                      placeholder="contact@federation.com"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Contact Email (Women)</Label>
                    <Input
                      value={organization.emailTemplates.inscription_pdf?.contact_email?.women || ""}
                      onChange={(e) =>
                        setOrganization({
                          ...organization,
                          emailTemplates: {
                            ...organization.emailTemplates,
                            inscription_pdf: {
                              ...(organization.emailTemplates.inscription_pdf || {
                                subject_prefix: "",
                                contact_email: { men: "", women: "" },
                                signature_urls: { men: "", women: "" },
                              }),
                              contact_email: {
                                ...(organization.emailTemplates.inscription_pdf?.contact_email || { men: "", women: "" }),
                                women: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="bg-white border-gray-300 mt-1"
                      placeholder="contact@federation.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">Signature URL (Men)</Label>
                    <Input
                      value={organization.emailTemplates.inscription_pdf?.signature_urls?.men || ""}
                      onChange={(e) =>
                        setOrganization({
                          ...organization,
                          emailTemplates: {
                            ...organization.emailTemplates,
                            inscription_pdf: {
                              ...(organization.emailTemplates.inscription_pdf || {
                                subject_prefix: "",
                                contact_email: { men: "", women: "" },
                                signature_urls: { men: "", women: "" },
                              }),
                              signature_urls: {
                                ...(organization.emailTemplates.inscription_pdf?.signature_urls || { men: "", women: "" }),
                                men: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="bg-white border-gray-300 mt-1"
                      placeholder="https://i.imgur.com/..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Signature URL (Women)</Label>
                    <Input
                      value={organization.emailTemplates.inscription_pdf?.signature_urls?.women || ""}
                      onChange={(e) =>
                        setOrganization({
                          ...organization,
                          emailTemplates: {
                            ...organization.emailTemplates,
                            inscription_pdf: {
                              ...(organization.emailTemplates.inscription_pdf || {
                                subject_prefix: "",
                                contact_email: { men: "", women: "" },
                                signature_urls: { men: "", women: "" },
                              }),
                              signature_urls: {
                                ...(organization.emailTemplates.inscription_pdf?.signature_urls || { men: "", women: "" }),
                                women: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="bg-white border-gray-300 mt-1"
                      placeholder="https://i.imgur.com/..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* New Inscription Template */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="font-semibold mb-2 text-green-900">✨ New Inscription Notification</h3>
              <p className="text-xs text-green-700 mb-3">Recipients notified when a new inscription is created</p>
              <div className="space-y-2">
                {(organization.emailTemplates.new_inscription?.recipients || []).map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={email}
                      onChange={(e) => {
                        const updated = [...(organization.emailTemplates.new_inscription?.recipients || [])];
                        updated[index] = e.target.value;
                        setOrganization({
                          ...organization,
                          emailTemplates: {
                            ...organization.emailTemplates,
                            new_inscription: { recipients: updated },
                          },
                        });
                      }}
                      className="bg-white border-gray-300"
                      placeholder="email@example.com"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = (organization.emailTemplates.new_inscription?.recipients || []).filter((_, i) => i !== index);
                        setOrganization({
                          ...organization,
                          emailTemplates: {
                            ...organization.emailTemplates,
                            new_inscription: { recipients: updated },
                          },
                        });
                      }}
                      className="cursor-pointer text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOrganization({
                      ...organization,
                      emailTemplates: {
                        ...organization.emailTemplates,
                        new_inscription: {
                          recipients: [...(organization.emailTemplates.new_inscription?.recipients || []), ""],
                        },
                      },
                    });
                  }}
                  className="cursor-pointer w-full"
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Add Recipient
                </Button>
              </div>
            </div>

            {/* Daily Recap Template */}
            <div className="border rounded-lg p-4 bg-purple-50">
              <h3 className="font-semibold mb-2 text-purple-900">📅 Daily Recap Email</h3>
              <p className="text-xs text-purple-700 mb-3">Recipients for daily summary emails</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600 mb-2">To Recipients</Label>
                  <div className="space-y-2">
                    {(organization.emailTemplates.daily_recap?.recipients || []).map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={email}
                          onChange={(e) => {
                            const updated = [...(organization.emailTemplates.daily_recap?.recipients || [])];
                            updated[index] = e.target.value;
                            setOrganization({
                              ...organization,
                              emailTemplates: {
                                ...organization.emailTemplates,
                                daily_recap: {
                                  ...(organization.emailTemplates.daily_recap || { recipients: [], cc: [] }),
                                  recipients: updated,
                                },
                              },
                            });
                          }}
                          className="bg-white border-gray-300"
                          placeholder="email@example.com"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = (organization.emailTemplates.daily_recap?.recipients || []).filter((_, i) => i !== index);
                            setOrganization({
                              ...organization,
                              emailTemplates: {
                                ...organization.emailTemplates,
                                daily_recap: {
                                  ...(organization.emailTemplates.daily_recap || { recipients: [], cc: [] }),
                                  recipients: updated,
                                },
                              },
                            });
                          }}
                          className="cursor-pointer text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOrganization({
                          ...organization,
                          emailTemplates: {
                            ...organization.emailTemplates,
                            daily_recap: {
                              ...organization.emailTemplates.daily_recap!,
                              recipients: [...(organization.emailTemplates.daily_recap?.recipients || []), ""],
                            },
                          },
                        });
                      }}
                      className="cursor-pointer w-full"
                    >
                      <PlusCircle className="w-4 h-4 mr-1" />
                      Add To Recipient
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-2">CC Recipients</Label>
                  <div className="space-y-2">
                    {(organization.emailTemplates.daily_recap?.cc || []).map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={email}
                          onChange={(e) => {
                            const updated = [...(organization.emailTemplates.daily_recap?.cc || [])];
                            updated[index] = e.target.value;
                            setOrganization({
                              ...organization,
                              emailTemplates: {
                                ...organization.emailTemplates,
                                daily_recap: {
                                  ...(organization.emailTemplates.daily_recap || { recipients: [], cc: [] }),
                                  cc: updated,
                                },
                              },
                            });
                          }}
                          className="bg-white border-gray-300"
                          placeholder="email@example.com"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = (organization.emailTemplates.daily_recap?.cc || []).filter((_, i) => i !== index);
                            setOrganization({
                              ...organization,
                              emailTemplates: {
                                ...organization.emailTemplates,
                                daily_recap: {
                                  ...(organization.emailTemplates.daily_recap || { recipients: [], cc: [] }),
                                  cc: updated,
                                },
                              },
                            });
                          }}
                          className="cursor-pointer text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOrganization({
                          ...organization,
                          emailTemplates: {
                            ...organization.emailTemplates,
                            daily_recap: {
                              ...organization.emailTemplates.daily_recap!,
                              cc: [...(organization.emailTemplates.daily_recap?.cc || []), ""],
                            },
                          },
                        });
                      }}
                      className="cursor-pointer w-full"
                    >
                      <PlusCircle className="w-4 h-4 mr-1" />
                      Add CC Recipient
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Inscription Template */}
            <div className="border rounded-lg p-4 bg-orange-50">
              <h3 className="font-semibold mb-2 text-orange-900">📬 Contact Inscription Notification</h3>
              <p className="text-xs text-orange-700 mb-3">Recipients for inscription contact form submissions</p>
              <div className="space-y-2">
                {(organization.emailTemplates.contact_inscription?.recipients || []).map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={email}
                      onChange={(e) => {
                        const updated = [...(organization.emailTemplates.contact_inscription?.recipients || [])];
                        updated[index] = e.target.value;
                        setOrganization({
                          ...organization,
                          emailTemplates: {
                            ...organization.emailTemplates,
                            contact_inscription: { recipients: updated },
                          },
                        });
                      }}
                      className="bg-white border-gray-300"
                      placeholder="email@example.com"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = (organization.emailTemplates.contact_inscription?.recipients || []).filter((_, i) => i !== index);
                        setOrganization({
                          ...organization,
                          emailTemplates: {
                            ...organization.emailTemplates,
                            contact_inscription: { recipients: updated },
                          },
                        });
                      }}
                      className="cursor-pointer text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOrganization({
                      ...organization,
                      emailTemplates: {
                        ...organization.emailTemplates,
                        contact_inscription: {
                          recipients: [...(organization.emailTemplates.contact_inscription?.recipients || []), ""],
                        },
                      },
                    });
                  }}
                  className="cursor-pointer w-full"
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Add Recipient
                </Button>
              </div>
            </div>

            {/* Event Data Updated Template */}
            <div className="border rounded-lg p-4 bg-cyan-50">
              <h3 className="font-semibold mb-2 text-cyan-900">🔄 Event Data Updated Notification</h3>
              <p className="text-xs text-cyan-700 mb-3">Recipients notified when event data is modified</p>
              <div className="space-y-2">
                {(organization.emailTemplates.event_data_updated?.recipients || []).map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={email}
                      onChange={(e) => {
                        const updated = [...(organization.emailTemplates.event_data_updated?.recipients || [])];
                        updated[index] = e.target.value;
                        setOrganization({
                          ...organization,
                          emailTemplates: {
                            ...organization.emailTemplates,
                            event_data_updated: { recipients: updated },
                          },
                        });
                      }}
                      className="bg-white border-gray-300"
                      placeholder="email@example.com"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = (organization.emailTemplates.event_data_updated?.recipients || []).filter((_, i) => i !== index);
                        setOrganization({
                          ...organization,
                          emailTemplates: {
                            ...organization.emailTemplates,
                            event_data_updated: { recipients: updated },
                          },
                        });
                      }}
                      className="cursor-pointer text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOrganization({
                      ...organization,
                      emailTemplates: {
                        ...organization.emailTemplates,
                        event_data_updated: {
                          recipients: [...(organization.emailTemplates.event_data_updated?.recipients || []), ""],
                        },
                      },
                    });
                  }}
                  className="cursor-pointer w-full"
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Add Recipient
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="cursor-pointer"
          >
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            {saving ? t("saving") : `💾 ${t("saveChanges")}`}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
