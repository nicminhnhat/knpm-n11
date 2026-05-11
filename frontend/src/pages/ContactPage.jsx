import { useState } from "react";
import FormField from "../components/FormField.jsx";
import { contactCards } from "../data/siteData.js";
import { Icon } from "../components/Icons.jsx";
import PageIntro from "../components/PageIntro.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { apiRequest } from "../lib/api.js";

function ContactPage() {
  const [form, setForm] = useState({ fullName: "", contact: "", content: "" });
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.contact.trim() || !form.content.trim()) {
      setNotice({ type: "error", message: "Vui long nhap day du thong tin truoc khi gui lien he." });
      return;
    }

    try {
      setIsSending(true);
      setNotice({ type: "", message: "" });
      await apiRequest("/api/contact", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setNotice({ type: "success", message: "Da gui lien he thanh cong. Admin se phan hoi som." });
      setForm({ fullName: "", contact: "", content: "" });
    } catch (error) {
      setNotice({ type: "error", message: error.message || "Khong the gui lien he. Vui long thu lai." });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <PageIntro
        aside={
          <div className="space-y-3">
            <p className="text-lg font-bold text-[color:var(--ink)]">Khung gio ho tro</p>
            <p>Thu 2 den Thu 7</p>
            <p>08:00 - 20:00</p>
          </div>
        }
        description="Lien he voi bo phan ho tro khi can tu van tim phong, dang tin hoac xu ly van de tai khoan."
        eyebrow="Lien he"
        title="Can ho tro tim phong hoac dang tin?"
      />

      <section className="section-space pt-4">
        <div className="shell space-y-8">
          <SectionHeader
            eyebrow="Dau moi ho tro"
            title="Chon kenh lien he phu hop voi nhu cau cua ban."
            description="Thong tin ho tro duoc trinh bay ngan gon de nguoi dung de lien he."
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {contactCards.map((item) => (
              <a
                key={item.title}
                className="panel-soft p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(23,50,77,0.1)]"
                href={item.href}
                rel="noreferrer"
                target={item.href.startsWith("http") ? "_blank" : undefined}
              >
                <div className="mb-4 inline-flex rounded-2xl bg-[color:var(--accent-soft)] p-3 text-[color:var(--brand)]">
                  <Icon className="h-5 w-5" name={item.icon} />
                </div>
                <h2 className="text-xl font-bold text-[color:var(--ink)]">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{item.content}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space pt-4">
        <div className="shell grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="panel p-6 sm:p-8">
            <SectionHeader
              eyebrow="Gui loi nhan"
              title="Gui noi dung can ho tro"
              description="Nhap thong tin lien he va noi dung can duoc ho tro."
            />
            <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
              <FormField
                label="Ho va ten"
                placeholder="Ho va ten"
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              />
              <FormField
                label="Email hoac so dien thoai"
                placeholder="Email hoac so dien thoai"
                value={form.contact}
                onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))}
              />
              <FormField
                label="Noi dung can ho tro"
                placeholder="Ban dang can ho tro ve tim phong, dang tin hay ket noi voi chu tro?"
                textarea
                value={form.content}
                onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              />
              {notice.message ? (
                <div className={`rounded-2xl px-4 py-3 text-sm ${notice.type === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-red-200 bg-red-50 text-red-700"}`}>
                  {notice.message}
                </div>
              ) : null}
              <button className="button-primary w-full sm:w-fit" disabled={isSending} type="submit">
                {isSending ? "Dang gui..." : "Gui lien he"}
              </button>
            </form>
          </div>

          <div className="panel-soft p-6 sm:p-8">
            <span className="eyebrow">Cau hoi thuong gap</span>
            <div className="mt-6 space-y-5">
              <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_10px_30px_rgba(22,50,74,0.06)]">
                <h3 className="text-lg font-bold">Mat bao lau de dang tin hoan chinh?</h3>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Neu da co anh, dia chi va muc gia ro rang thi ban co the hoan thanh trong vai phut.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_10px_30px_rgba(22,50,74,0.06)]">
                <h3 className="text-lg font-bold">Sinh vien co the loc phong theo tien nghi khong?</h3>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Co. Trang danh sach phong da duoc viet lai de loc theo gia, dien tich va tien ich.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_10px_30px_rgba(22,50,74,0.06)]">
                <h3 className="text-lg font-bold">Thong tin phong co duoc cap nhat thuong xuyen khong?</h3>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Co. Thong tin phong tro duoc cap nhat tu he thong quan ly du lieu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default ContactPage;
