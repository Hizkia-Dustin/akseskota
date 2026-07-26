import NavigationDashboard from "../components/NavigationDashboard";

export const metadata = {
  title: "Navigasi — AksesKota",
  description: "Cari, bandingkan, dan mulai rute yang sesuai kebutuhan mobilitasmu.",
};

export default async function NavigationPage({ searchParams }) {
  const params = await searchParams;
  const requestedProfile = params.profile;
  const initialProfile = ["wheelchair", "elderly", "stroller", "low-vision", "walking"].includes(requestedProfile)
    ? requestedProfile
    : "walking";

  const longitude = Number(params.lng);
  const latitude = Number(params.lat);
  const initialDestination = params.destination && Number.isFinite(longitude) && Number.isFinite(latitude)
    ? {
        id: params.externalId || params.destination,
        name: params.destination,
        address: "Destinasi katalog AksesKota",
        coordinates: [longitude, latitude],
      }
    : null;

  return <NavigationDashboard initialProfile={initialProfile} initialDestination={initialDestination} />;
}
