import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { slugify } from "@/lib/slug";

const log = logger.child({ module: 'AdminProduct' });

// Update Product
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const {
      name,
      slug,
      tagline,
      description,
      price,
      categoryId,
      isActive,
      deliveryFormat,
      seoTitle,
      seoDescription,
      searchKeywords,
      restockThreshold,
      supplierName,
      supplierUrl,
      supplierNotes,
    } = await req.json();
    const { id } = params;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug: typeof slug === "string" ? (slug.trim() ? slugify(slug) : null) : undefined,
        tagline,
        description,
        price,
        categoryId,
        isActive,
        deliveryFormat,
        seoTitle,
        seoDescription,
        searchKeywords,
        restockThreshold: typeof restockThreshold === "undefined" ? undefined : Number(restockThreshold),
        supplierName,
        supplierUrl,
        supplierNotes,
      }
    });
    
    log.info({ productId: id, changes: { name, slug, price, isActive, deliveryFormat } }, "Product updated");
    return NextResponse.json(product);
  } catch (error) {
    log.error({ err: error, productId: params.id }, "Failed to update product");
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// Delete Product
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { id } = params;
    
    await prisma.product.delete({
      where: { id }
    });
    
    log.info({ productId: id }, "Product deleted");
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error({ err: error, productId: params.id }, "Failed to delete product");
    return NextResponse.json({ error: "Failed to delete product. Make sure to delete licenses first." }, { status: 500 });
  }
}
