import { Request, Response } from "express";
import { GeneralService } from "../services/generalService";
import Page from "../models/pagesModel";

export default class FrontController {
  static async contact(req: Request, res: Response) {
    const result = await GeneralService.contactProcess(req);

    return res.status(result.http_status ?? 200).json({
      status: result.status,
      message: result.message,
      data: result.data ?? [],
    });
  }

  static async page(req: Request, res: Response) {
    try {
      const page = await Page.findBySlug(req.params.slug);
      if (!page) {
        return res.status(404).json({
          status: 0,
          message: "Page not found",
        });
      }
      return res.json({
        status: 1,
        message: "Page found",
        data: {
          title: page.title,
          body: page.body,
        },
      });
    } catch (error) {
      return res.status(500).json({
        status: 0,
        message: "Internal server error",
      });
    }
  }
}
