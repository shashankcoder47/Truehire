const normalizeBackendBaseUrl = () => {
  const rawBaseUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "")

  try {
    const parsed = new URL(rawBaseUrl)

    return parsed.toString().replace(/\/+$/, "")
  } catch (_error) {
    if (!rawBaseUrl) {
      throw new Error("NEXT_PUBLIC_API_URL or BACKEND_URL is required")
    }

    return rawBaseUrl
  }
}

const BACKEND_BASE_URL = normalizeBackendBaseUrl()

export async function GET(request) {
  const headers = {}
  const authorization = request.headers.get("authorization")

  if (authorization) {
    headers.Authorization = authorization
  }

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/recruiters/companies`, {
      method: "GET",
      headers,
      cache: "no-store"
    })

    const contentType = response.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      const data = await response.json()
      return Response.json(data, { status: response.status })
    }

    const text = await response.text()
    return new Response(text, {
      status: response.status,
      headers: contentType ? { "Content-Type": contentType } : undefined
    })
  } catch (error) {
    return Response.json(
      {
        message: "Backend API unavailable",
        details: error.message
      },
      { status: 502 }
    )
  }
}
