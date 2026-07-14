import NavigationDashboard from "../components/NavigationDashboard";

export const metadata = {
  title: "Navigasi — AksesKota",
  description: "Cari, bandingkan, dan mulai rute yang sesuai kebutuhan mobilitasmu.",
};

export default async function NavigationPage({ searchParams }) {
  const requestedProfile = (await searchParams).profile;
  const initialProfile = ["wheelchair", "elderly", "stroller", "low-vision", "walking"].includes(requestedProfile)
    ? requestedProfile
    : "walking";

  return <NavigationDashboard initialProfile={initialProfile} />;
}
